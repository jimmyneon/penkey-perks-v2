    -- Add INSERT policy for ducks table so users can check in
    -- This allows authenticated users to insert their own ducks (check-ins)

    DROP POLICY IF EXISTS "Users can insert own ducks" ON public.ducks;
    CREATE POLICY "Users can insert own ducks" ON public.ducks
    FOR INSERT WITH CHECK (auth.uid() = user_id);
