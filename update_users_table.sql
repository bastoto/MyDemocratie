-- Add email and password columns to public.users
-- NOTE: If you are using Supabase Auth, login credentials are automatically stored in the secure 'auth.users' table.
-- These columns in 'public.users' should be used if you are building a custom auth system or need to store contact emails separately.

ALTER TABLE public.users 
ADD COLUMN email text,
ADD COLUMN password text; -- Important: Ensure you encrypt passwords before inserting them here!
