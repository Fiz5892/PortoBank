-- PortoBank Schema - Consolidated Migration
-- Created from 16 separate migrations (2026-04-23 to 2026-05-07)

-- ============================================================================
-- 1. ROLES & SECURITY
-- ============================================================================

-- Roles enum and user_roles table (security best practice: roles in separate table)
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS \$\$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
\$\$;

CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 2. PROFILES & BASIC TABLES
-- ============================================================================

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE,
  full_name TEXT,
  bio TEXT,
  avatar_url TEXT,
  location TEXT,
  profession TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  role TEXT NOT NULL DEFAULT 'user',
  email_contact text,
  phone text,
  website_url text,
  linkedin_url text,
  github_url text,
  instagram_url text,
  twitter_url text,
  behance_url text,
  dribbble_url text,
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (is_public = true AND is_active = true);
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete any profile" ON public.profiles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete their own profile" ON public.profiles
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ============================================================================
-- 3. PORTFOLIOS & PORTFOLIO ITEMS
-- ============================================================================

CREATE TABLE public.portfolios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published portfolios are viewable by everyone" ON public.portfolios
  FOR SELECT USING (is_published = true);
CREATE POLICY "Users can view their own portfolios" ON public.portfolios
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all portfolios" ON public.portfolios
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert their own portfolios" ON public.portfolios
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own portfolios" ON public.portfolios
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can update any portfolio" ON public.portfolios
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete any portfolio" ON public.portfolios
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can delete their own portfolios" ON public.portfolios
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.portfolio_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  external_link TEXT,
  tags TEXT[] DEFAULT '{}',
  gallery_images text[] DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Items of published portfolios are viewable" ON public.portfolio_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.is_published = true)
  );
CREATE POLICY "Users can view items of their own portfolios" ON public.portfolio_items
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Users can insert items into their portfolios" ON public.portfolio_items
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Users can update items in their portfolios" ON public.portfolio_items
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Users can delete items in their portfolios" ON public.portfolio_items
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.portfolios p WHERE p.id = portfolio_id AND p.user_id = auth.uid())
  );

-- ============================================================================
-- 4. SKILLS & SKILL CATEGORIES
-- ============================================================================

CREATE TABLE public.skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Skills of public profiles are viewable" ON public.skills
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.is_public = true AND p.is_active = true)
  );
CREATE POLICY "Users can view their own skills" ON public.skills
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Users can insert their own skills" ON public.skills
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Users can update their own skills" ON public.skills
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid())
  );
CREATE POLICY "Users can delete their own skills" ON public.skills
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = profile_id AND p.user_id = auth.uid())
  );

CREATE TABLE public.skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON public.skill_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert categories"
  ON public.skill_categories FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update categories"
  ON public.skill_categories FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete categories"
  ON public.skill_categories FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 5. EXPERIENCES & EDUCATIONS
-- ============================================================================

CREATE TABLE public.experiences (
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

CREATE TABLE public.educations (
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

-- ============================================================================
-- 6. LIKES & REPORTS
-- ============================================================================

CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, portfolio_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like portfolios" ON public.likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own likes" ON public.likes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  target_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reports" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);
CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can submit reports" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- ============================================================================
-- 7. MESSAGES (with encryption support)
-- ============================================================================

-- Schema for app secrets (encryption key)
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC, anon, authenticated;

CREATE TABLE IF NOT EXISTS private.app_secrets (
  key text PRIMARY KEY,
  value text NOT NULL
);
REVOKE ALL ON private.app_secrets FROM PUBLIC, anon, authenticated;

-- Enable pgcrypto for symmetric encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Insert random encryption key if not exists
INSERT INTO private.app_secrets (key, value)
VALUES ('message_key', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (key) DO NOTHING;

CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  receiver_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  deleted_for_everyone boolean NOT NULL DEFAULT false,
  deleted_for_user_ids uuid[] NOT NULL DEFAULT '{}',
  edited_at timestamptz,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own messages" ON public.messages
  FOR SELECT TO authenticated USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
CREATE POLICY "Users can send messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Receivers can update read status" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = receiver_id);
CREATE POLICY "Senders can edit their messages" ON public.messages
  FOR UPDATE TO authenticated USING (auth.uid() = sender_id);
CREATE POLICY "Users can delete their own sent messages" ON public.messages
  FOR DELETE TO authenticated USING (auth.uid() = sender_id);

-- Encryption/Decryption helpers
CREATE OR REPLACE FUNCTION private.encrypt_text(plaintext text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = private, extensions, public
AS \$\$
DECLARE
  k text;
BEGIN
  k := current_setting('app.message_key', true);
  IF k IS NULL OR k = '' THEN
    k := 'portobank-default-message-key-change-me';
  END IF;
  RETURN encode(pgp_sym_encrypt(plaintext, k), 'base64');
END;
\$\$;

CREATE OR REPLACE FUNCTION private.decrypt_text(ciphertext text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = private, extensions, public
AS \$\$
DECLARE
  k text;
BEGIN
  IF ciphertext IS NULL OR ciphertext = '' THEN RETURN ''; END IF;
  k := current_setting('app.message_key', true);
  IF k IS NULL OR k = '' THEN
    k := 'portobank-default-message-key-change-me';
  END IF;
  BEGIN
    RETURN pgp_sym_decrypt(decode(ciphertext, 'base64'), k);
  EXCEPTION WHEN OTHERS THEN
    RETURN ciphertext;
  END;
END;
\$\$;

-- Message RPCs
CREATE OR REPLACE FUNCTION public.send_message(p_receiver_id uuid, p_body text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS \$\$
DECLARE
  new_id uuid;
  encrypted text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  encrypted := private.encrypt_text(p_body);
  INSERT INTO public.messages (sender_id, receiver_id, body)
  VALUES (auth.uid(), p_receiver_id, encrypted)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
\$\$;

CREATE OR REPLACE FUNCTION public.edit_message(p_message_id uuid, p_new_body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS \$\$
DECLARE
  m public.messages%ROWTYPE;
  encrypted text;
BEGIN
  SELECT * INTO m FROM public.messages WHERE id = p_message_id;
  IF m IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  IF auth.uid() <> m.sender_id THEN
    RAISE EXCEPTION 'Only sender can edit';
  END IF;
  encrypted := private.encrypt_text(p_new_body);
  UPDATE public.messages SET body = encrypted, edited_at = now() WHERE id = p_message_id;
END;
\$\$;

CREATE OR REPLACE FUNCTION public.delete_message_for_everyone(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS \$\$
DECLARE
  m public.messages%ROWTYPE;
BEGIN
  SELECT * INTO m FROM public.messages WHERE id = p_message_id;
  IF m IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  IF auth.uid() <> m.sender_id THEN
    RAISE EXCEPTION 'Only sender can delete for everyone';
  END IF;
  UPDATE public.messages SET deleted_for_everyone = true WHERE id = p_message_id;
END;
\$\$;

CREATE OR REPLACE FUNCTION public.delete_message_for_me(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS \$\$
DECLARE
  m public.messages%ROWTYPE;
BEGIN
  SELECT * INTO m FROM public.messages WHERE id = p_message_id;
  IF m IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;
  IF auth.uid() <> m.receiver_id AND auth.uid() <> m.sender_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  UPDATE public.messages
  SET deleted_for_user_ids = array_append(deleted_for_user_ids, auth.uid())
  WHERE id = p_message_id;
END;
\$\$;

CREATE OR REPLACE FUNCTION public.get_thread(p_partner_id uuid)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  body text,
  is_read boolean,
  edited_at timestamptz,
  created_at timestamptz,
  deleted_for_everyone boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, private
AS \$\$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  RETURN QUERY
  SELECT m.id, m.sender_id, m.receiver_id, private.decrypt_text(m.body), m.is_read, m.edited_at, m.created_at, m.deleted_for_everyone
  FROM public.messages m
  WHERE ((m.sender_id = auth.uid() AND m.receiver_id = p_partner_id)
     OR (m.sender_id = p_partner_id AND m.receiver_id = auth.uid()))
    AND NOT (auth.uid() = ANY(m.deleted_for_user_ids))
  ORDER BY m.created_at ASC;
END;
\$\$;

CREATE OR REPLACE FUNCTION public.get_conversations()
RETURNS TABLE (
  partner_id uuid,
  latest_message_body text,
  latest_message_time timestamptz,
  sender_id uuid,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, private
AS \$\$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  RETURN QUERY
  WITH recent_messages AS (
    SELECT DISTINCT ON (CASE WHEN m.sender_id = auth.uid() THEN m.receiver_id ELSE m.sender_id END)
           CASE WHEN m.sender_id = auth.uid() THEN m.receiver_id ELSE m.sender_id END as partner,
           m.sender_id,
           m.body,
           m.created_at,
           m.deleted_for_everyone
    FROM public.messages m
    WHERE (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
      AND NOT (auth.uid() = ANY(m.deleted_for_user_ids))
    ORDER BY (CASE WHEN m.sender_id = auth.uid() THEN m.receiver_id ELSE m.sender_id END), m.created_at DESC
  )
  SELECT rm.partner, 
         CASE WHEN rm.deleted_for_everyone THEN 'This message was deleted' ELSE private.decrypt_text(rm.body) END,
         rm.created_at, rm.sender_id,
         COUNT(m.id)::bigint
  FROM recent_messages rm
  LEFT JOIN public.messages m ON (m.sender_id = rm.partner AND m.receiver_id = auth.uid() AND NOT m.is_read 
                                  AND NOT (auth.uid() = ANY(m.deleted_for_user_ids)))
  GROUP BY rm.partner, rm.deleted_for_everyone, rm.body, rm.created_at, rm.sender_id;
END;
\$\$;

CREATE OR REPLACE FUNCTION public.mark_thread_read(p_partner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS \$\$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.messages
  SET is_read = true
  WHERE receiver_id = auth.uid() AND sender_id = p_partner_id AND NOT is_read;
END;
\$\$;
CREATE OR REPLACE FUNCTION public.clear_conversation_for_me(p_partner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.messages
  SET deleted_for_user_ids = array_append(deleted_for_user_ids, auth.uid())
  WHERE ((sender_id = auth.uid() AND receiver_id = p_partner_id)
      OR (sender_id = p_partner_id AND receiver_id = auth.uid()))
    AND NOT auth.uid() = ANY(deleted_for_user_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_conversation_for_me(p_partner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.messages
  SET deleted_for_user_ids = array_append(deleted_for_user_ids, auth.uid())
  WHERE ((sender_id = auth.uid() AND receiver_id = p_partner_id)
      OR (sender_id = p_partner_id AND receiver_id = auth.uid()))
    AND NOT auth.uid() = ANY(deleted_for_user_ids);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_conversation_for_everyone(p_partner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.messages
  SET deleted_for_user_ids = ARRAY(
    SELECT DISTINCT unnest(deleted_for_user_ids || ARRAY[auth.uid(), p_partner_id])
  )
  WHERE (sender_id = auth.uid() AND receiver_id = p_partner_id)
     OR (sender_id = p_partner_id AND receiver_id = auth.uid());
END;
$$;

GRANT EXECUTE ON FUNCTION public.send_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.edit_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_message_for_everyone(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_message_for_me(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_thread(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_thread_read(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_conversation_for_me(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_conversation_for_me(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_conversation_for_everyone(uuid) TO authenticated;

-- ============================================================================
-- 8. ADMIN & MODERATION
-- ============================================================================

CREATE TABLE public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view admin logs" ON public.admin_logs
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can insert admin logs" ON public.admin_logs
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = admin_id);

CREATE TABLE public.suspension_appeals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.suspension_appeals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit own appeals"
  ON public.suspension_appeals
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own appeals"
  ON public.suspension_appeals
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all appeals"
  ON public.suspension_appeals
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update appeals"
  ON public.suspension_appeals
  FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- ============================================================================
-- 9. PROFILE ROLE SYNC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS \$\$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    UPDATE public.profiles
       SET role = COALESCE(
         (SELECT role::text FROM public.user_roles
            WHERE user_id = OLD.user_id
            ORDER BY CASE role::text WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END
            LIMIT 1),
         'user'
       )
     WHERE user_id = OLD.user_id;
    RETURN OLD;
  ELSE
    UPDATE public.profiles
       SET role = COALESCE(
         (SELECT role::text FROM public.user_roles
            WHERE user_id = NEW.user_id
            ORDER BY CASE role::text WHEN 'admin' THEN 1 WHEN 'moderator' THEN 2 ELSE 3 END
            LIMIT 1),
         'user'
       )
     WHERE user_id = NEW.user_id;
    RETURN NEW;
  END IF;
END;
\$\$;

DROP TRIGGER IF EXISTS user_roles_sync_profile ON public.user_roles;
CREATE TRIGGER user_roles_sync_profile
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role();

REVOKE EXECUTE ON FUNCTION public.sync_profile_role() FROM PUBLIC, anon, authenticated;

-- ============================================================================
-- 10. STORAGE BUCKETS
-- ============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', false)
ON CONFLICT (id) DO NOTHING;

-- AVATARS policies (public read, owner-write under their own folder)
CREATE POLICY "Public can read individual avatar files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] IS NOT NULL
);

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- CVS policies (private — owner only)
CREATE POLICY "Users can view their own CVs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own CVs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own CVs"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own CVs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'cvs'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- 11. INDEXES
-- ============================================================================

CREATE INDEX idx_portfolios_user ON public.portfolios(user_id);
CREATE INDEX idx_portfolio_items_portfolio ON public.portfolio_items(portfolio_id);
CREATE INDEX idx_skills_profile ON public.skills(profile_id);
CREATE INDEX idx_experiences_user_id ON public.experiences(user_id);
CREATE INDEX idx_educations_user_id ON public.educations(user_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_sender ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver_unread ON public.messages (receiver_id, is_read);
CREATE INDEX idx_likes_portfolio ON public.likes(portfolio_id);
CREATE INDEX idx_reports_status ON public.reports(status);
CREATE INDEX idx_suspension_appeals_user_id ON public.suspension_appeals(user_id);
CREATE INDEX idx_suspension_appeals_status ON public.suspension_appeals(status);

-- ============================================================================
-- 12. TRIGGERS & HELPER FUNCTIONS
-- ============================================================================

-- Auto-create profile + default user role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS \$\$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', NULL)
  );
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  RETURN NEW;
END;
\$\$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Top liked profiles
CREATE OR REPLACE FUNCTION public.get_top_liked_profiles(p_pool integer DEFAULT 100)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  username text,
  full_name text,
  profession text,
  location text,
  avatar_url text,
  total_likes bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS \$\$
  WITH like_counts AS (
    SELECT p.user_id, COUNT(l.id) AS lc
      FROM public.portfolios p
      LEFT JOIN public.likes l ON l.portfolio_id = p.id
      GROUP BY p.user_id
  )
  SELECT pr.id, pr.user_id, pr.username, pr.full_name, pr.profession,
         pr.location, pr.avatar_url, COALESCE(lc.lc, 0) AS total_likes
    FROM public.profiles pr
    LEFT JOIN like_counts lc ON lc.user_id = pr.user_id
   WHERE pr.is_public = true
     AND pr.is_active = true
     AND pr.role <> 'admin'
   ORDER BY COALESCE(lc.lc, 0) DESC, pr.created_at DESC
   LIMIT p_pool;
\$\$;
