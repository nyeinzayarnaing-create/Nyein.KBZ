-- King & Queen Voting App - Initial Schema
-- Run this migration in your Supabase SQL editor

-- Candidates table
CREATE TABLE IF NOT EXISTS public.candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  gender TEXT NOT NULL CHECK (gender IN ('king', 'queen')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;

-- Anyone can read candidates
CREATE POLICY "Anyone can read candidates" ON public.candidates
  FOR SELECT USING (true);

-- Votes table
CREATE TABLE IF NOT EXISTS public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id TEXT NOT NULL,
  candidate_id UUID NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(voter_id, candidate_id)
);

-- One vote per voter per candidate (enforced by UNIQUE above)
-- One vote per category (king/queen) enforced in application layer

-- Enable RLS on votes
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Users can insert their own vote (voter_id from client)
CREATE POLICY "Users can insert votes" ON public.votes
  FOR INSERT WITH CHECK (true);

-- Anyone can read votes (for leaderboard)
CREATE POLICY "Anyone can read votes" ON public.votes
  FOR SELECT USING (true);

-- Allow delete (for admin Reset Voting)
CREATE POLICY "Allow delete votes" ON public.votes
  FOR DELETE USING (true);

-- Settings table (singleton)
CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  timer_seconds INT DEFAULT 300,
  timer_end_at TIMESTAMPTZ,
  voting_active BOOLEAN DEFAULT false,
  winners_revealed BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default settings row
INSERT INTO public.settings (id, timer_seconds, voting_active, winners_revealed)
VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 300, false, false)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on settings
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings
CREATE POLICY "Anyone can read settings" ON public.settings
  FOR SELECT USING (true);

-- Only service role can update (we'll use API route with service key for admin)
-- For now allow update - you can restrict via RLS with auth if you add Supabase Auth
CREATE POLICY "Allow update settings" ON public.settings
  FOR UPDATE USING (true)
  WITH CHECK (true);

-- Enable Realtime for votes and settings
ALTER PUBLICATION supabase_realtime ADD TABLE public.votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
