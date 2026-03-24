-- ============================================
-- RUN THIS ONCE in Supabase SQL Editor
-- ============================================
-- 1. Open https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Click "New query"
-- 5. Paste this entire file
-- 6. Click "Run"
-- ============================================

-- Add delete policy (allows reset via API)
DROP POLICY IF EXISTS "Allow delete votes" ON public.votes;
CREATE POLICY "Allow delete votes" ON public.votes
  FOR DELETE USING (true);

-- Create reset function (bypasses RLS)
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
