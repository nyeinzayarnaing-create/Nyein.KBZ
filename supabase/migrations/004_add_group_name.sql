-- Add group_name column to candidates table
ALTER TABLE public.candidates ADD COLUMN IF NOT EXISTS group_name TEXT DEFAULT '';

-- Allow admin to insert candidates
CREATE POLICY "Allow insert candidates" ON public.candidates
  FOR INSERT WITH CHECK (true);

-- Allow admin to update candidates
CREATE POLICY "Allow update candidates" ON public.candidates
  FOR UPDATE USING (true) WITH CHECK (true);

-- Allow admin to delete candidates
CREATE POLICY "Allow delete candidates" ON public.candidates
  FOR DELETE USING (true);
