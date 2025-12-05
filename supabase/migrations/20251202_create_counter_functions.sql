-- Create RPC functions for atomic counter updates

-- Function to increment a counter column
CREATE OR REPLACE FUNCTION increment_counter(
    table_name text,
    row_id bigint,
    column_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE format(
        'UPDATE %I SET %I = COALESCE(%I, 0) + 1 WHERE article_id = $1',
        table_name,
        column_name,
        column_name
    ) USING row_id;
END;
$$;

-- Function to decrement a counter column
CREATE OR REPLACE FUNCTION decrement_counter(
    table_name text,
    row_id bigint,
    column_name text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    EXECUTE format(
        'UPDATE %I SET %I = GREATEST(COALESCE(%I, 0) - 1, 0) WHERE article_id = $1',
        table_name,
        column_name,
        column_name
    ) USING row_id;
END;
$$;
