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
AS $$
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
$$;