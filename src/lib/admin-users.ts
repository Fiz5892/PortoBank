import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the list of user_ids that have the 'admin' role.
 * Used to exclude admin accounts from public listings/search.
 */
export const fetchAdminUserIds = async (): Promise<string[]> => {
  const { data, error } = await supabase
    .from("user_roles")
    .select("user_id")
    .eq("role", "admin");
  if (error || !data) return [];
  return data.map((r) => r.user_id);
};
