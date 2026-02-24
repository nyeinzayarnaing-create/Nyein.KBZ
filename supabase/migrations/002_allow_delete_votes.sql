-- Allow admin to delete all votes (used by Restart Voting)
-- Run this in Supabase SQL Editor if Restart Voting fails with permission error

CREATE POLICY "Allow delete votes" ON public.votes
  FOR DELETE USING (true);
