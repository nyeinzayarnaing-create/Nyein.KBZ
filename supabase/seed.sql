-- Optional: Seed sample candidates for testing
-- Run after the migration

-- Run once to add sample candidates
INSERT INTO public.candidates (name, photo_url, gender) VALUES
  ('Alex', NULL, 'king'),
  ('Jordan', NULL, 'king'),
  ('Sam', NULL, 'queen'),
  ('Taylor', NULL, 'queen');
