-- Reset Database Script
-- WARNING: This will delete ALL data from the database
-- Use this to test signup flow from scratch

-- Delete all data in reverse order of dependencies

-- Delete voting history
DELETE FROM voting_history;

-- Delete messages
DELETE FROM messages;

-- Delete topics
DELETE FROM topics;

-- Delete debate spaces
DELETE FROM debatespaces;

-- Delete articles
DELETE FROM articles;

-- Delete users from public.users table
DELETE FROM users;

-- Note: To delete auth users, you need to do this manually in Supabase Dashboard
-- Go to Authentication -> Users and delete all users there
-- Or use the Supabase Management API

-- Reset sequences (optional - keeps IDs starting from 1)
ALTER SEQUENCE articles_id_seq RESTART WITH 1;
ALTER SEQUENCE topics_id_seq RESTART WITH 1;
ALTER SEQUENCE messages_id_seq RESTART WITH 1;
ALTER SEQUENCE debatespaces_id_seq RESTART WITH 1;

-- Verify deletion
SELECT 'Users count: ' || COUNT(*) FROM users;
SELECT 'Articles count: ' || COUNT(*) FROM articles;
SELECT 'Topics count: ' || COUNT(*) FROM topics;
SELECT 'Messages count: ' || COUNT(*) FROM messages;
SELECT 'Debate spaces count: ' || COUNT(*) FROM debatespaces;
SELECT 'Voting history count: ' || COUNT(*) FROM voting_history;
