CREATE OR REPLACE FUNCTION public.sync_profile_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    -- Recompute role for the affected user (highest privilege wins).
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
$$;

DROP TRIGGER IF EXISTS user_roles_sync_profile ON public.user_roles;
CREATE TRIGGER user_roles_sync_profile
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_profile_role();