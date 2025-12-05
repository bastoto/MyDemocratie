-- Update process_voting_to_final function to handle 'Ignored' status
-- Articles with zero votes will be marked as 'Ignored' instead of 'Rejected'

CREATE OR REPLACE FUNCTION process_voting_to_final()
RETURNS TABLE(
  article_id bigint,
  old_status article_status,
  new_status article_status,
  approve_count integer,
  reject_count integer
) AS $$
BEGIN
  RETURN QUERY
  WITH eligible_articles AS (
    -- Find articles in "Voting opened" status
    SELECT 
      a.id,
      a.status,
      a.statuschangedate
    FROM articles a
    WHERE a.status = 'Voting opened'
      AND a.statuschangedate IS NOT NULL
  ),
  articles_ready AS (
    -- Check if 2 weeks have passed
    SELECT 
      ea.id,
      ea.status
    FROM eligible_articles ea
    WHERE NOW() >= ea.statuschangedate + INTERVAL '14 days'
  ),
  vote_results AS (
    -- Get vote counts for each article
    SELECT 
      vr.article_id,
      vr.nb_approve,
      vr.nb_reject,
      CASE 
        WHEN vr.nb_approve + vr.nb_reject = 0 THEN 'Ignored'::article_status
        WHEN vr.nb_approve > vr.nb_reject THEN 'Approved'::article_status
        ELSE 'Rejected'::article_status
      END as final_status
    FROM voting_opened_result vr
    INNER JOIN articles_ready ar ON vr.article_id = ar.id
  ),
  updated_articles AS (
    -- Update article status
    UPDATE articles a
    SET 
      status = vr.final_status,
      statuschangedate = NOW()
    FROM vote_results vr
    INNER JOIN articles_ready ar ON vr.article_id = ar.id
    WHERE a.id = ar.id
    RETURNING a.id, ar.status as old_status, a.status as new_status
  )
  SELECT 
    ua.id,
    ua.old_status,
    ua.new_status,
    vr.nb_approve,
    vr.nb_reject
  FROM updated_articles ua
  INNER JOIN vote_results vr ON ua.id = vr.article_id;
END;
$$ LANGUAGE plpgsql;
