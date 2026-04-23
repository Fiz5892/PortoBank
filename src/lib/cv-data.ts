import { supabase } from "@/integrations/supabase/client";
import type { CVData } from "./cv-pdf";

export const fetchCVDataByUserId = async (userId: string, email?: string | null): Promise<CVData | null> => {
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, profession, location, bio")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return null;

  const [{ data: skills }, { data: portfolios }] = await Promise.all([
    supabase.from("skills").select("name").eq("profile_id", profile.id),
    supabase.from("portfolios").select("id").eq("user_id", userId),
  ]);

  const portfolioIds = (portfolios ?? []).map((p) => p.id);
  let items: CVData["items"] = [];
  if (portfolioIds.length > 0) {
    const { data: itemsData } = await supabase
      .from("portfolio_items")
      .select("type, title, description, external_link, tags")
      .in("portfolio_id", portfolioIds)
      .order("created_at", { ascending: false });
    items = (itemsData ?? []) as CVData["items"];
  }

  return {
    fullName: profile.full_name ?? "",
    profession: profile.profession,
    location: profile.location,
    email: email ?? null,
    bio: profile.bio,
    skills: (skills ?? []).map((s) => s.name),
    items,
  };
};
