-- Add INSERT RLS policy for profiles table
-- Allows users to create their own profile on first save

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);
