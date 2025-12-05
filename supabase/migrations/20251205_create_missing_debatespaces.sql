-- Verify debate spaces exist for all articles
-- This script checks and creates missing debate spaces

-- First, let's see which articles are missing debate spaces
SELECT a.id, a.title
FROM articles a
LEFT JOIN debatespaces d ON a.id = d.article_id
WHERE d.id IS NULL;

-- Create debate spaces for articles that don't have one
INSERT INTO debatespaces (article_id, creationdate)
SELECT id, creationdate
FROM articles
WHERE id NOT IN (SELECT article_id FROM debatespaces)
ON CONFLICT (article_id) DO NOTHING;

-- Verify all articles now have debate spaces
SELECT 
    (SELECT COUNT(*) FROM articles) as total_articles,
    (SELECT COUNT(*) FROM debatespaces) as total_debate_spaces;
