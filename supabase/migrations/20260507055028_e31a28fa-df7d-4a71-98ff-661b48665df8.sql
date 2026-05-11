ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- Mark all existing profiles as completed so existing users aren't trapped.
UPDATE public.profiles SET onboarding_completed = true WHERE onboarding_completed = false;