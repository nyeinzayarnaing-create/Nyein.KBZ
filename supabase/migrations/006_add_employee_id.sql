-- Add employee_id to candidates table
ALTER TABLE public.candidates
ADD COLUMN IF NOT EXISTS employee_id TEXT;
