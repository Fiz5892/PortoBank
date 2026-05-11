-- 1. Schema for app secrets (encryption key)
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

-- 2. Modify messages table
ALTER TABLE public.messages DROP COLUMN IF EXISTS subject;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_for_everyone boolean NOT NULL DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS deleted_for_user_ids uuid[] NOT NULL DEFAULT '{}';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS edited_at timestamptz;

-- Allow update of body for editing
DROP POLICY IF EXISTS "Senders can edit their messages" ON public.messages;
CREATE POLICY "Senders can edit their messages"
  ON public.messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = sender_id);

-- 3. Internal helpers
CREATE OR REPLACE FUNCTION private.get_message_key()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private
AS $$
  SELECT value FROM private.app_secrets WHERE key = 'message_key';
$$;

CREATE OR REPLACE FUNCTION private.encrypt_text(plaintext text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  k text;
BEGIN
  IF plaintext IS NULL THEN RETURN NULL; END IF;
  k := private.get_message_key();
  RETURN encode(pgp_sym_encrypt(plaintext, k), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION private.decrypt_text(ciphertext text)
RETURNS text
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  k text;
BEGIN
  IF ciphertext IS NULL OR ciphertext = '' THEN RETURN ''; END IF;
  k := private.get_message_key();
  BEGIN
    RETURN pgp_sym_decrypt(decode(ciphertext, 'base64'), k);
  EXCEPTION WHEN OTHERS THEN
    -- legacy plaintext rows
    RETURN ciphertext;
  END;
END;
$$;

-- 4. Public RPCs
CREATE OR REPLACE FUNCTION public.send_message(p_receiver_id uuid, p_body text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  new_id uuid;
  encrypted text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_body IS NULL OR length(trim(p_body)) = 0 THEN
    RAISE EXCEPTION 'Message body cannot be empty';
  END IF;
  IF length(p_body) > 5000 THEN
    RAISE EXCEPTION 'Message too long';
  END IF;
  encrypted := private.encrypt_text(p_body);
  INSERT INTO public.messages (sender_id, receiver_id, body, is_read)
  VALUES (auth.uid(), p_receiver_id, encrypted, false)
  RETURNING id INTO new_id;
  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.edit_message(p_message_id uuid, p_new_body text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, private
AS $$
DECLARE
  m public.messages%ROWTYPE;
BEGIN
  SELECT * INTO m FROM public.messages WHERE id = p_message_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Message not found'; END IF;
  IF m.sender_id <> auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF m.deleted_for_everyone THEN RAISE EXCEPTION 'Message deleted'; END IF;
  IF now() - m.created_at > interval '10 minutes' THEN
    RAISE EXCEPTION 'Edit window expired';
  END IF;
  IF p_new_body IS NULL OR length(trim(p_new_body)) = 0 THEN
    RAISE EXCEPTION 'Body required';
  END IF;
  UPDATE public.messages
     SET body = private.encrypt_text(p_new_body),
         edited_at = now()
   WHERE id = p_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_message_for_everyone(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m public.messages%ROWTYPE;
BEGIN
  SELECT * INTO m FROM public.messages WHERE id = p_message_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Message not found'; END IF;
  IF m.sender_id <> auth.uid() THEN RAISE EXCEPTION 'Not allowed'; END IF;
  IF now() - m.created_at > interval '6 hours' THEN
    RAISE EXCEPTION 'Delete-for-everyone window expired';
  END IF;
  UPDATE public.messages
     SET deleted_for_everyone = true,
         body = ''
   WHERE id = p_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_message_for_me(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  m public.messages%ROWTYPE;
BEGIN
  SELECT * INTO m FROM public.messages WHERE id = p_message_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Message not found'; END IF;
  IF auth.uid() NOT IN (m.sender_id, m.receiver_id) THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  UPDATE public.messages
     SET deleted_for_user_ids = array(SELECT DISTINCT unnest(deleted_for_user_ids || auth.uid()))
   WHERE id = p_message_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_thread(p_partner_id uuid)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  body text,
  is_read boolean,
  created_at timestamptz,
  edited_at timestamptz,
  deleted_for_everyone boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, private
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  RETURN QUERY
  SELECT m.id, m.sender_id, m.receiver_id,
         CASE WHEN m.deleted_for_everyone THEN '' ELSE private.decrypt_text(m.body) END,
         m.is_read, m.created_at, m.edited_at, m.deleted_for_everyone
    FROM public.messages m
   WHERE ((m.sender_id = auth.uid() AND m.receiver_id = p_partner_id)
       OR (m.sender_id = p_partner_id AND m.receiver_id = auth.uid()))
     AND NOT (auth.uid() = ANY(m.deleted_for_user_ids))
   ORDER BY m.created_at ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_conversations()
RETURNS TABLE (
  partner_id uuid,
  last_body text,
  last_at timestamptz,
  last_sender_id uuid,
  last_deleted boolean,
  unread_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public, private
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  RETURN QUERY
  WITH base AS (
    SELECT
      CASE WHEN m.sender_id = auth.uid() THEN m.receiver_id ELSE m.sender_id END AS partner,
      m.*
    FROM public.messages m
    WHERE (m.sender_id = auth.uid() OR m.receiver_id = auth.uid())
      AND NOT (auth.uid() = ANY(m.deleted_for_user_ids))
  ),
  latest AS (
    SELECT DISTINCT ON (partner) partner, id, body, created_at, sender_id, deleted_for_everyone
      FROM base
     ORDER BY partner, created_at DESC
  )
  SELECT l.partner,
         CASE WHEN l.deleted_for_everyone THEN '' ELSE private.decrypt_text(l.body) END,
         l.created_at,
         l.sender_id,
         l.deleted_for_everyone,
         (SELECT count(*) FROM base b WHERE b.partner = l.partner AND b.receiver_id = auth.uid() AND b.is_read = false)
    FROM latest l
   ORDER BY l.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_thread_read(p_partner_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.messages
     SET is_read = true
   WHERE receiver_id = auth.uid()
     AND sender_id = p_partner_id
     AND is_read = false;
END;
$$;

-- 5. Grants
GRANT EXECUTE ON FUNCTION public.send_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.edit_message(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_message_for_everyone(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_message_for_me(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_thread(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversations() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_thread_read(uuid) TO authenticated;

-- Enable realtime trigger refetch (table already in publication assumed; ensure)
ALTER TABLE public.messages REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.messages';
  END IF;
END$$;