-- Add 'Ignored' status to article_status enum
-- This status is used for articles that receive zero votes during the voting period

ALTER TYPE article_status ADD VALUE IF NOT EXISTS 'Ignored';
