-- Anonymous Voting System Migration
-- Changes voter_id from UUID to TEXT to store SHA-256 hashes

-- Step 1: Drop the foreign key constraint
ALTER TABLE voting_history 
DROP CONSTRAINT IF EXISTS voting_history_voter_id_fkey;

-- Step 2: Change voter_id column type from UUID to TEXT
ALTER TABLE voting_history 
ALTER COLUMN voter_id TYPE TEXT USING voter_id::TEXT;

-- Step 3: Clear existing voting history (since we can't rehash without knowing the salt)
-- IMPORTANT: This will delete all existing votes
TRUNCATE TABLE voting_history;

-- Step 4: Also clear vote counts since history is cleared
UPDATE debate_duration_voting_opened_result 
SET votecount_one_month = 0,
    votecount_two_months = 0,
    votecount_three_months = 0,
    votecount_four_months = 0,
    votecount_five_months = 0,
    votecount_six_months = 0,
    voted_debate_duration = NULL;

UPDATE voting_opened_result 
SET nb_approve = 0,
    nb_reject = 0;

-- Step 5: Update RLS policies to work with TEXT voter_id
-- The existing policies should still work since they don't directly reference the voter_id type
-- But we'll recreate them to be explicit

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own voting history" ON voting_history;
DROP POLICY IF EXISTS "Users can insert their own votes" ON voting_history;
DROP POLICY IF EXISTS "Users can update their own votes" ON voting_history;

-- Recreate policies (note: these will now work with hashed voter_id)
-- Since voter_id is now a hash, we can't use auth.uid() directly
-- These policies will be enforced at the application level instead
CREATE POLICY "Authenticated users can view voting history" 
ON voting_history FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Authenticated users can insert votes" 
ON voting_history FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update votes" 
ON voting_history FOR UPDATE 
TO authenticated 
USING (true);
