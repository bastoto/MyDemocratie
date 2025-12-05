-- Enable RLS on debate-related tables
ALTER TABLE debatespaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Debatespaces: Everyone can read, authenticated users can insert (via article creation)
CREATE POLICY "Anyone can view debate spaces"
ON debatespaces FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create debate spaces"
ON debatespaces FOR INSERT
TO authenticated
WITH CHECK (true);

-- Topics: Everyone can read, authenticated users can create
CREATE POLICY "Anyone can view topics"
ON topics FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create topics"
ON topics FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their topics"
ON topics FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);

-- Messages: Everyone can read, authenticated users can create
CREATE POLICY "Anyone can view messages"
ON messages FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create messages"
ON messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Authors can update their messages"
ON messages FOR UPDATE
TO authenticated
USING (auth.uid() = author_id)
WITH CHECK (auth.uid() = author_id);
