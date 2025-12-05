-- Article Status Lifecycle Workflow - Database Migration
-- This migration implements the automated status transition system using pg_cron

-- ============================================================================
-- 1. ENABLE EXTENSIONS
-- ============================================================================

-- Enable pg_cron for scheduling
CREATE EXTENSION IF NOT EXISTS pg_cron;



-- ============================================================================
-- 3. HELPER FUNCTION: Convert debate_duration to days
-- ============================================================================

CREATE OR REPLACE FUNCTION get_duration_days(duration debate_duration)
RETURNS integer AS $$
BEGIN
  RETURN CASE duration
    WHEN 'One Month' THEN 30
    WHEN 'Two Months' THEN 60
    WHEN 'Three Months' THEN 90
    WHEN 'Four Month' THEN 120
    WHEN 'Five Month' THEN 150
    WHEN 'Six Month' THEN 180
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- 4. TRANSITION FUNCTION: Debate Duration Voting -> Debate Ongoing
-- ============================================================================

CREATE OR REPLACE FUNCTION process_debate_duration_to_ongoing()
RETURNS TABLE(
  article_id bigint,
  old_status article_status,
  new_status article_status,
  winning_duration debate_duration
) AS $$
BEGIN
  RETURN QUERY
  WITH eligible_articles AS (
    -- Find articles in "Debate Duration voting opened" status
    SELECT a.id, a.status
    FROM articles a
    WHERE a.status = 'Debate Duration voting opened'
  ),
  first_votes AS (
    -- Get the first vote date for each article
    SELECT 
      vh.article_id,
      MIN(vh.votedate) as first_vote_date
    FROM voting_history vh
    WHERE vh.typevote = 'Debate_Duration_voting'
    GROUP BY vh.article_id
  ),
  articles_ready AS (
    -- Check if 1 week has passed since first vote
    SELECT 
      ea.id,
      ea.status,
      fv.first_vote_date
    FROM eligible_articles ea
    INNER JOIN first_votes fv ON ea.id = fv.article_id
    WHERE NOW() >= fv.first_vote_date + INTERVAL '7 days'
  ),
  winning_durations AS (
    -- Calculate the winning duration for each article
    SELECT 
      dr.article_id,
      CASE 
        WHEN dr.votecount_six_months >= GREATEST(
          dr.votecount_one_month,
          dr.votecount_two_months,
          dr.votecount_three_months,
          dr.votecount_four_months,
          dr.votecount_five_months,
          dr.votecount_six_months
        ) THEN 'Six Month'::debate_duration
        WHEN dr.votecount_five_months >= GREATEST(
          dr.votecount_one_month,
          dr.votecount_two_months,
          dr.votecount_three_months,
          dr.votecount_four_months,
          dr.votecount_five_months
        ) THEN 'Five Month'::debate_duration
        WHEN dr.votecount_four_months >= GREATEST(
          dr.votecount_one_month,
          dr.votecount_two_months,
          dr.votecount_three_months,
          dr.votecount_four_months
        ) THEN 'Four Month'::debate_duration
        WHEN dr.votecount_three_months >= GREATEST(
          dr.votecount_one_month,
          dr.votecount_two_months,
          dr.votecount_three_months
        ) THEN 'Three Months'::debate_duration
        WHEN dr.votecount_two_months >= GREATEST(
          dr.votecount_one_month,
          dr.votecount_two_months
        ) THEN 'Two Months'::debate_duration
        ELSE 'One Month'::debate_duration
      END as duration
    FROM debate_duration_voting_opened_result dr
    INNER JOIN articles_ready ar ON dr.article_id = ar.id
  ),
  updated_articles AS (
    -- Update article status and voted_debate_duration
    UPDATE articles a
    SET 
      status = 'Debate ongoing'::article_status,
      statuschangedate = NOW()
    FROM articles_ready ar
    WHERE a.id = ar.id
    RETURNING a.id, ar.status as old_status, a.status as new_status
  ),
  updated_durations AS (
    -- Update the voted_debate_duration in debate_duration_voting_opened_result
    UPDATE debate_duration_voting_opened_result dr
    SET voted_debate_duration = wd.duration
    FROM winning_durations wd
    WHERE dr.article_id = wd.article_id
    RETURNING dr.article_id, dr.voted_debate_duration
  )
  SELECT 
    ua.id,
    ua.old_status,
    ua.new_status,
    ud.voted_debate_duration
  FROM updated_articles ua
  INNER JOIN updated_durations ud ON ua.id = ud.article_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. TRANSITION FUNCTION: Debate Ongoing -> Voting Opened
-- ============================================================================

CREATE OR REPLACE FUNCTION process_debate_ongoing_to_voting()
RETURNS TABLE(
  article_id bigint,
  old_status article_status,
  new_status article_status,
  debate_duration_days integer
) AS $$
BEGIN
  RETURN QUERY
  WITH eligible_articles AS (
    -- Find articles in "Debate ongoing" status
    SELECT 
      a.id,
      a.status,
      a.statuschangedate,
      dr.voted_debate_duration
    FROM articles a
    INNER JOIN debate_duration_voting_opened_result dr ON a.id = dr.article_id
    WHERE a.status = 'Debate ongoing'
      AND a.statuschangedate IS NOT NULL
      AND dr.voted_debate_duration IS NOT NULL
  ),
  articles_ready AS (
    -- Check if the voted duration has elapsed
    SELECT 
      ea.id,
      ea.status,
      ea.voted_debate_duration,
      get_duration_days(ea.voted_debate_duration) as duration_days
    FROM eligible_articles ea
    WHERE NOW() >= ea.statuschangedate + (get_duration_days(ea.voted_debate_duration) || ' days')::INTERVAL
  ),
  updated_articles AS (
    -- Update article status
    UPDATE articles a
    SET 
      status = 'Voting opened'::article_status,
      statuschangedate = NOW()
    FROM articles_ready ar
    WHERE a.id = ar.id
    RETURNING a.id, ar.status as old_status, a.status as new_status, ar.duration_days
  )
  SELECT 
    ua.id,
    ua.old_status,
    ua.new_status,
    ua.duration_days
  FROM updated_articles ua;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 6. TRANSITION FUNCTION: Voting Opened -> Approved/Rejected
-- ============================================================================

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

-- ============================================================================
-- 7. MASTER FUNCTION: Process all status transitions
-- ============================================================================

CREATE OR REPLACE FUNCTION process_all_status_transitions()
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  transition1_count integer;
  transition2_count integer;
  transition3_count integer;
BEGIN
  -- Process all three transitions
  WITH 
  t1 AS (SELECT COUNT(*) as cnt FROM process_debate_duration_to_ongoing()),
  t2 AS (SELECT COUNT(*) as cnt FROM process_debate_ongoing_to_voting()),
  t3 AS (SELECT COUNT(*) as cnt FROM process_voting_to_final())
  SELECT 
    jsonb_build_object(
      'success', true,
      'timestamp', NOW(),
      'transitions', jsonb_build_object(
        'debate_duration_to_ongoing', (SELECT cnt FROM t1),
        'debate_ongoing_to_voting', (SELECT cnt FROM t2),
        'voting_to_final', (SELECT cnt FROM t3)
      ),
      'total_processed', (SELECT cnt FROM t1) + (SELECT cnt FROM t2) + (SELECT cnt FROM t3)
    )
  INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. SCHEDULE JOB (pg_cron)
-- ============================================================================

-- Schedule the job to run every hour
-- Note: You may need to enable pg_cron in Supabase Dashboard first
SELECT cron.schedule(
  'process-article-statuses', -- job name
  '0 0 * * *',                -- schedule (every day at midnight)
  $$SELECT process_all_status_transitions()$$
);

-- ============================================================================
-- 9. GRANT PERMISSIONS
-- ============================================================================

-- Grant execute permissions to authenticated users and service role
GRANT EXECUTE ON FUNCTION get_duration_days(debate_duration) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION process_debate_duration_to_ongoing() TO service_role;
GRANT EXECUTE ON FUNCTION process_debate_ongoing_to_voting() TO service_role;
GRANT EXECUTE ON FUNCTION process_voting_to_final() TO service_role;
GRANT EXECUTE ON FUNCTION process_all_status_transitions() TO service_role;

-- ============================================================================
-- 10. COMMENTS
-- ============================================================================

COMMENT ON FUNCTION get_duration_days IS 'Converts debate_duration enum to number of days';
COMMENT ON FUNCTION process_debate_duration_to_ongoing IS 'Transitions articles from "Debate Duration voting opened" to "Debate ongoing"';
COMMENT ON FUNCTION process_debate_ongoing_to_voting IS 'Transitions articles from "Debate ongoing" to "Voting opened"';
COMMENT ON FUNCTION process_voting_to_final IS 'Transitions articles from "Voting opened" to "Approved" or "Rejected"';
COMMENT ON FUNCTION process_all_status_transitions IS 'Master function that processes all status transitions and returns summary';
