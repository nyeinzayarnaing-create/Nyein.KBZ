-- REQUIRED: Run this in Supabase SQL Editor for Reset Voting to work
-- Dashboard > SQL Editor > New query > Paste and Run

CREATE OR REPLACE FUNCTION public.reset_all_votes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.votes;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reset_all_votes() TO anon;
GRANT EXECUTE ON FUNCTION public.reset_all_votes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_all_votes() TO service_role;
