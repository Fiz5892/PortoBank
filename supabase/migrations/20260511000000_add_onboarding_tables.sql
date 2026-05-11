-- Keep onboarding aligned with the existing PortoBank schema.
-- The app already stores education, experience, portfolio projects, and skills in:
-- public.educations, public.experiences, public.portfolios/public.portfolio_items,
-- and public.skills(profile_id).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_contact text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}'::text[];

ALTER TABLE public.skills
  ADD COLUMN IF NOT EXISTS level text DEFAULT 'Intermediate';

CREATE INDEX IF NOT EXISTS idx_educations_user_id ON public.educations(user_id);
CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON public.experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON public.portfolios(user_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_portfolio_id ON public.portfolio_items(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_skills_profile_id ON public.skills(profile_id);
