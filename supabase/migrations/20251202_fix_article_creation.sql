-- Add missing columns to articles table
-- This migration fixes issues preventing article creation

-- 1. Add category column if it doesn't exist (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'category'
    ) THEN
        -- First create the enum if it doesn't exist
        CREATE TYPE IF NOT EXISTS article_category AS ENUM (
          'fundamental_rights',
          'governance',
          'judiciary',
          'economy_finance',
          'defense_security',
          'environment',
          'education_culture',
          'public_administration',
          'amendments_procedures',
          'miscellaneous_provisions',
          'criminal_law',
          'civil_rights',
          'tax_legislation',
          'healthcare_policy',
          'infrastructure_development'
        );
        
        -- Add the column
        ALTER TABLE articles ADD COLUMN category article_category;
        
        -- Update existing rows with a default value
        UPDATE articles SET category = 'miscellaneous_provisions' WHERE category IS NULL;
        
        -- Make it NOT NULL
        ALTER TABLE articles ALTER COLUMN category SET NOT NULL;
    END IF;
END $$;

-- 3. Add official_article_number column if it doesn't exist (idempotent)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'articles' AND column_name = 'official_article_number'
    ) THEN
        ALTER TABLE articles ADD COLUMN official_article_number INTEGER;
    END IF;
END $$;
