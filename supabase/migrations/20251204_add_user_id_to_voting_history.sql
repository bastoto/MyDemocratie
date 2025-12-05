-- Add user_id column to voting_history for activity tracking
-- This enables showing user's vote history in their activity feed
-- while vote values remain anonymous via the hashed voter_id

ALTER TABLE voting_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Create index for efficient user activity queries
CREATE INDEX IF NOT EXISTS idx_voting_history_user_id ON voting_history(user_id);

-- Grant permissions
GRANT SELECT ON voting_history TO authenticated;
