-- Migration: Add email column to profiles and backfill existing data
-- Run this after updating supabase-setup.sql

-- Step 1: Add email column if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email text;

-- Step 2: Backfill email for existing profiles from auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
AND p.email IS NULL;

-- Step 3: Update the trigger function to include email for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, email)
  VALUES (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Player'), new.email);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 4: Ensure the RLS policy allows authenticated users to view profiles
-- (This should already exist from the updated supabase-setup.sql, but adding for safety)
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
USING ( auth.role() = 'authenticated' );

