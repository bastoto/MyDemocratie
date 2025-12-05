-- Add RLS policy to allow authors to update their own articles

CREATE POLICY "Authors can update their own articles"
ON public.articles
FOR UPDATE
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);
