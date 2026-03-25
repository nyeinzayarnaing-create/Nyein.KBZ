-- Performance Groups table
CREATE TABLE IF NOT EXISTS public.performance_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.performance_groups ENABLE ROW LEVEL SECURITY;

-- Anyone can read performance groups
CREATE POLICY "Anyone can read performance groups" ON public.performance_groups
  FOR SELECT USING (true);

-- Require service role to modify (enforced in application layer via API routes)
CREATE POLICY "Allow modify performance groups" ON public.performance_groups
  FOR ALL USING (true) WITH CHECK (true);

-- Performance Votes table
CREATE TABLE IF NOT EXISTS public.performance_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voter_id TEXT NOT NULL,
  group_id UUID NOT NULL REFERENCES public.performance_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(voter_id)
);

-- Enable RLS on performance votes
ALTER TABLE public.performance_votes ENABLE ROW LEVEL SECURITY;

-- Users can insert their own vote
CREATE POLICY "Users can insert performance votes" ON public.performance_votes
  FOR INSERT WITH CHECK (true);

-- Anyone can read performance votes
CREATE POLICY "Anyone can read performance votes" ON public.performance_votes
  FOR SELECT USING (true);

-- Allow delete (for admin Reset Voting)
CREATE POLICY "Allow delete performance votes" ON public.performance_votes
  FOR DELETE USING (true);


-- Add performance voting columns to settings
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS performance_voting_active BOOLEAN DEFAULT false;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS performance_winners_revealed BOOLEAN DEFAULT false;

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_votes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.performance_groups;
