-- Extend profiles with contact + social fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_contact text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS linkedin_url text,
  ADD COLUMN IF NOT EXISTS github_url text,
  ADD COLUMN IF NOT EXISTS instagram_url text,
  ADD COLUMN IF NOT EXISTS twitter_url text,
  ADD COLUMN IF NOT EXISTS behance_url text,
  ADD COLUMN IF NOT EXISTS dribbble_url text;

-- Add gallery_images to portfolio_items
ALTER TABLE public.portfolio_items
  ADD COLUMN IF NOT EXISTS gallery_images text[] DEFAULT '{}'::text[];

-- experiences
CREATE TABLE IF NOT EXISTS public.experiences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  job_title text NOT NULL,
  company_name text NOT NULL,
  employment_type text,
  start_date date,
  end_date date,
  is_current boolean NOT NULL DEFAULT false,
  location text,
  description text,
  company_logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.experiences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experiences of public profiles are viewable"
  ON public.experiences FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = experiences.user_id AND p.is_public = true AND p.is_active = true
    )
  );

CREATE POLICY "Users can view their own experiences"
  ON public.experiences FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all experiences"
  ON public.experiences FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own experiences"
  ON public.experiences FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own experiences"
  ON public.experiences FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own experiences"
  ON public.experiences FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_experiences_user_id ON public.experiences(user_id);

-- educations
CREATE TABLE IF NOT EXISTS public.educations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  degree text NOT NULL,
  field_of_study text,
  institution_name text NOT NULL,
  start_year integer,
  end_year integer,
  gpa text,
  description text,
  institution_logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.educations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Educations of public profiles are viewable"
  ON public.educations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = educations.user_id AND p.is_public = true AND p.is_active = true
    )
  );

CREATE POLICY "Users can view their own educations"
  ON public.educations FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all educations"
  ON public.educations FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can insert their own educations"
  ON public.educations FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own educations"
  ON public.educations FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own educations"
  ON public.educations FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_educations_user_id ON public.educations(user_id);