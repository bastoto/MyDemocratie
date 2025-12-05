-- Create topic_category enum
CREATE TYPE topic_category AS ENUM (
    'Approval',
    'Reject',
    'Doubt',
    'Improvement'
);

-- Add category column to topics table
ALTER TABLE topics
ADD COLUMN category topic_category;
