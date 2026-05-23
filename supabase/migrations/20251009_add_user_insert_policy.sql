    -- Add INSERT policy for users table to allow sign-up
    -- This fixes the 401 error when users try to create their profile during sign-up

    CREATE POLICY "Users can insert own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id);
