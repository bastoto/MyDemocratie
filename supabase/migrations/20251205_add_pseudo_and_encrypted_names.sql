-- Add pseudo and encrypted name columns to users table
-- Also clean up all existing data for fresh start

-- First, delete all dependent data
DELETE FROM message_reported;
DELETE FROM messages;
DELETE FROM topics;
DELETE FROM debatespaces;
DELETE FROM voting_history;
DELETE FROM debate_duration_voting_opened_result;
DELETE FROM voting_opened_result;
DELETE FROM articles;
DELETE FROM users WHERE id NOT IN (SELECT id FROM auth.users);

-- Add new columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS pseudo TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS encrypted_firstname TEXT,
ADD COLUMN IF NOT EXISTS encrypted_lastname TEXT;

-- Make pseudo required for new users (existing users will need to set it)
-- We'll handle this in the application logic
