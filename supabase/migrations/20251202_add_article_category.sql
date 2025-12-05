-- Add article_category enum and category column to articles table

-- 1. Create the enum type
CREATE TYPE article_category AS ENUM (
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

-- 2. Add the column to the articles table
ALTER TABLE articles 
ADD COLUMN category article_category;

-- 3. Update existing rows (optional, but good practice if we want to enforce NOT NULL later)
-- For now, we'll leave it nullable for existing records, or we could set a default.
-- Given the user said "mandatory field", we should ideally make it NOT NULL.
-- However, for existing records, we need a default. Let's assume 'miscellaneous_provisions' for existing ones if any.
UPDATE articles SET category = 'miscellaneous_provisions' WHERE category IS NULL;

-- 4. Add NOT NULL constraint
ALTER TABLE articles 
ALTER COLUMN category SET NOT NULL;
