CREATE OR REPLACE FUNCTION private.encrypt_text(plaintext text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = private, extensions, public
AS $$
DECLARE
  k text;
BEGIN
  k := current_setting('app.message_key', true);
  IF k IS NULL OR k = '' THEN
    k := 'portobank-default-message-key-change-me';
  END IF;
  RETURN encode(extensions.pgp_sym_encrypt(plaintext, k), 'base64');
END;
$$;

CREATE OR REPLACE FUNCTION private.decrypt_text(ciphertext text)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = private, extensions, public
AS $$
DECLARE
  k text;
BEGIN
  IF ciphertext IS NULL OR ciphertext = '' THEN RETURN ''; END IF;
  k := current_setting('app.message_key', true);
  IF k IS NULL OR k = '' THEN
    k := 'portobank-default-message-key-change-me';
  END IF;
  BEGIN
    RETURN extensions.pgp_sym_decrypt(decode(ciphertext, 'base64'), k);
  EXCEPTION WHEN OTHERS THEN
    RETURN ciphertext;
  END;
END;
$$;