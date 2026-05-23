-- Add date_of_birth column to users table for onboarding
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS date_of_birth DATE;
