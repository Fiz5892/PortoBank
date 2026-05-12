import { supabase } from "@/integrations/supabase/client";
import { OnboardingData, EducationEntry, ExperienceEntry, PortfolioEntry, SkillEntry } from "@/types/onboarding";

export const fetchCVDataByUserId = async (userId: string, email?: string | null): Promise<OnboardingData | null> => {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return null;

  const [
    { data: skillsData },
    { data: portfolios },
    { data: educationsData },
    { data: experiencesData }
  ] = await Promise.all([
    supabase.from("skills").select("*").eq("profile_id", profile.id),
    supabase.from("portfolios").select("id").eq("user_id", userId),
    supabase.from("educations").select("*").eq("user_id", userId),
    supabase.from("experiences").select("*").eq("user_id", userId),
  ]);

  const portfolioIds = (portfolios ?? []).map((p) => p.id);
  let portfolioItems: PortfolioEntry[] = [];
  if (portfolioIds.length > 0) {
    const { data: itemsData } = await supabase
      .from("portfolio_items")
      .select("*")
      .in("portfolio_id", portfolioIds)
      .order("created_at", { ascending: false });
    
    portfolioItems = (itemsData ?? []).map(proj => ({
      id: proj.id,
      title: proj.title || "",
      description: proj.description || "",
      tech_stack: proj.tags || [],
      demo_url: proj.external_link || undefined,
      repository_url: undefined,
      year: new Date(proj.created_at || Date.now()).getFullYear()
    }));
  }

  const education: EducationEntry[] = (educationsData ?? []).map(edu => {
    const parsedGpa = edu.gpa ? parseFloat(edu.gpa) : undefined;
    return {
      id: edu.id,
      institution_name: edu.institution_name || "",
      degree: edu.degree || "",
      field_of_study: edu.field_of_study || "",
      start_year: edu.start_year || 0,
      end_year: edu.end_year || 0,
      gpa: parsedGpa && !isNaN(parsedGpa) ? parsedGpa : undefined,
      description: edu.description || "",
      logo_url: edu.institution_logo_url || undefined,
    };
  });

  const experience: ExperienceEntry[] = (experiencesData ?? []).map(exp => ({
    id: exp.id,
    job_title: exp.job_title || "",
    company_name: exp.company_name || "",
    employment_type: exp.employment_type || "Full-time",
    location: exp.location || "",
    start_date: exp.start_date && typeof exp.start_date === 'string' ? exp.start_date.slice(0, 7) : "",
    end_date: exp.end_date && typeof exp.end_date === 'string' ? exp.end_date.slice(0, 7) : null,
    is_current: exp.is_current || false,
    description: exp.description || "",
    logo_url: exp.company_logo_url || undefined,
  }));

  const skills: SkillEntry[] = (skillsData ?? []).map(skill => ({
    id: skill.id,
    name: skill.name || "",
    category: skill.category || "Programming Language",
    level: skill.level || "Intermediate",
  }));

  return {
    profile: {
      full_name: profile.full_name || "",
      profession: profile.profession || "",
      bio: profile.bio || "",
      location: profile.location || "",
      avatar_url: profile.avatar_url || null,
      email: email || profile.email_contact || "",
      linkedin_url: profile.linkedin_url || "",
      github_url: profile.github_url || "",
      website_url: profile.website_url || "",
      twitter_url: profile.twitter_url || "",
    },
    education,
    experience,
    portfolio: portfolioItems,
    skills,
  };
};
