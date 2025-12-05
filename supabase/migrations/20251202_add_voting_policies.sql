-- Add RLS policies for voting tables

-- 1. debate_duration_voting_opened_result
-- Allow everyone to view results
CREATE POLICY "Everyone can view debate duration results"
ON public.debate_duration_voting_opened_result FOR SELECT
USING (true);

-- Allow authenticated users to insert (for initialization)
CREATE POLICY "Authenticated users can insert debate duration results"
ON public.debate_duration_voting_opened_result FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update (for voting)
-- Note: In a real app, we might want stricter control (e.g. only via RPC), but for now allow update
CREATE POLICY "Authenticated users can update debate duration results"
ON public.debate_duration_voting_opened_result FOR UPDATE
USING (auth.role() = 'authenticated');


-- 2. voting_opened_result
-- Allow everyone to view results
CREATE POLICY "Everyone can view voting results"
ON public.voting_opened_result FOR SELECT
USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Authenticated users can insert voting results"
ON public.voting_opened_result FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow authenticated users to update
CREATE POLICY "Authenticated users can update voting results"
ON public.voting_opened_result FOR UPDATE
USING (auth.role() = 'authenticated');


-- 3. voting_history
-- Users can view their own votes
CREATE POLICY "Users can view their own votes"
ON public.voting_history FOR SELECT
USING (auth.uid() = voter_id);

-- Users can insert their own votes
CREATE POLICY "Users can insert their own votes"
ON public.voting_history FOR INSERT
WITH CHECK (auth.uid() = voter_id);

-- Users can update their own votes
CREATE POLICY "Users can update their own votes"
ON public.voting_history FOR UPDATE
USING (auth.uid() = voter_id);
