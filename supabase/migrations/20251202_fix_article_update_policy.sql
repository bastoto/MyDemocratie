-- Drop existing policy if it exists and recreate it
DROP POLICY IF EXISTS "Authors can update their own articles" ON public.articles;

-- Create the update policy for articles
CREATE POLICY "Authors can update their own articles"
ON public.articles
FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Verify the policy was created
SELECT policyname, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'articles' AND policyname = 'Authors can update their own articles';
