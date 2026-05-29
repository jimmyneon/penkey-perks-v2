-- Add profile_qr_code field to profiles table
-- This stores the unique QR code for each customer's profile

ALTER TABLE public.profiles 
ADD COLUMN profile_qr_code TEXT UNIQUE;

-- Create index for faster lookups
CREATE INDEX idx_profiles_profile_qr_code ON public.profiles(profile_qr_code);

-- Generate QR codes for existing users
UPDATE public.profiles 
SET profile_qr_code = 'PROFILE-' || encode(gen_random_bytes(16), 'hex')
WHERE profile_qr_code IS NULL;

-- Add comment
COMMENT ON COLUMN public.profiles.profile_qr_code IS 'Unique QR code for customer profile (format: PROFILE-{hex})';
