import { supabase } from "@/integrations/supabase/client";

export const logAdminAction = async (
  adminId: string,
  action: string,
  targetType?: string,
  targetId?: string,
) => {
  await supabase.from("admin_logs").insert({
    admin_id: adminId,
    action,
    target_type: targetType ?? null,
    target_id: targetId ?? null,
  });
};
