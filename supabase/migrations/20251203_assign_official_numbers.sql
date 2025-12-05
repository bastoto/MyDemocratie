-- Migration to assign official article numbers to approved constitutional articles
-- This ensures that when a constitutional article is approved, it gets the next sequential number

-- First, let's create a function to get the next official article number
CREATE OR REPLACE FUNCTION get_next_official_article_number()
RETURNS INTEGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- Get the maximum official_article_number and add 1
    -- If no articles exist yet, start at 1
    SELECT COALESCE(MAX(official_article_number), 0) + 1
    INTO next_number
    FROM articles
    WHERE type = 'constitutional' 
    AND status = 'Approved'
    AND official_article_number IS NOT NULL;
    
    RETURN next_number;
END;
$$ LANGUAGE plpgsql;

-- Now update the test cron job to assign official numbers when approving constitutional articles
-- First, unschedule the existing test job
SELECT cron.unschedule('test_article_status_transitions_every_minute');

-- Recreate it with official number assignment logic
SELECT cron.schedule(
    'test_article_status_transitions_every_minute',
    '* * * * *',
    $$
    -- Transition from "Voting opened" to "Approved" or "Rejected"
    WITH transition_data AS (
        SELECT 
            a.id,
            a.type,
            CASE
                WHEN v.nb_approve > v.nb_reject THEN 'Approved'::article_status
                ELSE 'Rejected'::article_status
            END as new_status
        FROM articles a
        LEFT JOIN voting_opened_result v ON v.article_id = a.id
        WHERE a.status = 'Voting opened'
        AND a.statuschangedate + INTERVAL '14 days' <= NOW()
    )
    UPDATE articles
    SET 
        status = td.new_status,
        statuschangedate = NOW(),
        -- Assign official number only for constitutional articles being approved
        official_article_number = CASE
            WHEN td.type = 'constitutional' AND td.new_status = 'Approved'::article_status
            THEN get_next_official_article_number()
            ELSE articles.official_article_number
        END
    FROM transition_data td
    WHERE articles.id = td.id;
    $$
);
