-- Men & Lady Voting App - Security Hardening
-- Run this migration in your Supabase SQL editor

-- 1. Remove permissive policies from original schema
DROP POLICY IF EXISTS "Allow delete votes" ON public.votes;
DROP POLICY IF EXISTS "Allow update settings" ON public.settings;

-- 2. Remove permissive policies from performance groups schema
DROP POLICY IF EXISTS "Allow modify performance groups" ON public.performance_groups;
DROP POLICY IF EXISTS "Allow delete performance votes" ON public.performance_votes;

-- 3. Review and ensure necessary policies remain
-- 'Anyone can read candidates' (SELECT) - OK
-- 'Users can insert votes' (INSERT) - OK
-- 'Anyone can read votes' (SELECT) - OK
-- 'Anyone can read settings' (SELECT) - OK
-- 'Anyone can read performance groups' (SELECT) - OK
-- 'Users can insert performance votes' (INSERT) - OK
-- 'Anyone can read performance votes' (SELECT) - OK

-- NOTE: All DELETE and UPDATE operations are now restricted.
-- They will be performed by the Service Role (createAdminClient) which bypasses RLS.
