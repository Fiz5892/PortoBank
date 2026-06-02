import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Download, Loader2, Save } from "lucide-react";
import { fetchCVDataByUserId } from "@/lib/cv-data";
import { downloadCV } from "@/lib/cv-pdf";
import { ProfileStep } from "@/components/onboarding/ProfileStep";
import { EducationStep } from "@/components/onboarding/EducationStep";
import { ExperienceStep } from "@/components/onboarding/ExperienceStep";
import { PortfolioStep } from "@/components/onboarding/PortfolioStep";
import { SkillsStep } from "@/components/onboarding/SkillsStep";
import { CVPreview } from "@/components/onboarding/CVPreview";
import { CVFormatToolbar, CVFormatOptions, DEFAULT_FORMAT } from "@/components/onboarding/CVFormatToolbar";
import type {
  EducationEntry,
  ExperienceEntry,
  OnboardingData,
  PortfolioEntry,
  ProfileData,
  SkillEntry,
} from "@/types/onboarding";

const STEPS = ["Profile", "Education", "Experience", "Portfolio", "Skills"] as const;

const TABLE = {
  education: "educations",
  experience: "experiences",
  portfolios: "portfolios",
  portfolioItems: "portfolio_items",
  skills: "skills",
} as const;

const DEFAULT_PROFILE: ProfileData = {
  full_name: "",
  profession: "",
  bio: "",
  location: "",
  avatar_url: null,
  email: "",
  linkedin_url: "",
  github_url: "",
  website_url: "",
  twitter_url: "",
};

const DEFAULT_DATA: OnboardingData = {
  profile: DEFAULT_PROFILE,
  education: [],
  experience: [],
  portfolio: [],
  skills: [],
};

function throwIfError(error: unknown) {
  if (error) throw error;
}

const EditProfile = () => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingCV, setDownloadingCV] = useState(false);
  const [format, setFormat] = useState<CVFormatOptions>(DEFAULT_FORMAT);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      try {
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        throwIfError(profileError);

        const [{ data: educations, error: eduError }, { data: experiences, error: expError }] =
          await Promise.all([
            supabase.from(TABLE.education).select("*").eq("user_id", user.id),
            supabase.from(TABLE.experience).select("*").eq("user_id", user.id),
          ]);
        throwIfError(eduError);
        throwIfError(expError);

        const { data: portfolios, error: portfoliosError } = await supabase
          .from(TABLE.portfolios)
          .select("id")
          .eq("user_id", user.id);
        throwIfError(portfoliosError);

        const portfolioIds = (portfolios ?? []).map((portfolio) => portfolio.id);
        const { data: portfolioItems, error: itemsError } =
          portfolioIds.length > 0
            ? await supabase
                .from(TABLE.portfolioItems)
                .select("*")
                .in("portfolio_id", portfolioIds)
                .order("created_at", { ascending: false })
            : { data: [], error: null };
        throwIfError(itemsError);

        const { data: skills, error: skillsError } = profile?.id
          ? await supabase.from(TABLE.skills).select("*").eq("profile_id", profile.id)
          : { data: [], error: null };
        throwIfError(skillsError);

        setData({
          profile: {
            full_name: profile?.full_name ?? "",
            profession: profile?.profession ?? "",
            bio: profile?.bio ?? "",
            location: profile?.location ?? "",
            avatar_url: profile?.avatar_url ?? null,
            email: profile?.email_contact ?? user.email ?? "",
            linkedin_url: profile?.linkedin_url ?? "",
            github_url: profile?.github_url ?? "",
            website_url: profile?.website_url ?? "",
            twitter_url: profile?.twitter_url ?? "",
          },
          education: (educations ?? []).map((edu): EducationEntry => ({
            id: edu.id,
            institution_name: edu.institution_name || "",
            degree: edu.degree || "",
            field_of_study: edu.field_of_study || "",
            start_year: edu.start_year || 0,
            end_year: edu.end_year || 0,
            gpa: edu.gpa ? parseFloat(edu.gpa) : undefined,
            description: edu.description || "",
            logo_url: edu.institution_logo_url || undefined,
          })),
          experience: (experiences ?? []).map((exp): ExperienceEntry => ({
            id: exp.id,
            job_title: exp.job_title || "",
            company_name: exp.company_name || "",
            employment_type: (exp.employment_type || "Full-time") as ExperienceEntry["employment_type"],
            location: exp.location || "",
            start_date: exp.start_date ? exp.start_date.slice(0, 7) : "",
            end_date: exp.end_date ? exp.end_date.slice(0, 7) : null,
            is_current: exp.is_current || false,
            description: exp.description || "",
            logo_url: exp.company_logo_url || undefined,
          })),
          portfolio: (portfolioItems ?? []).map((project: any): PortfolioEntry => ({
            id: project.id,
            title: project.title || "",
            description: project.description || "",
            tech_stack: project.tags || [],
            demo_url: project.external_link || undefined,
            repository_url: undefined,
            year: new Date(project.created_at || Date.now()).getFullYear(),
          })),
          skills: (skills ?? []).map((skill: any): SkillEntry => ({
            id: skill.id,
            name: skill.name || "",
            category: skill.category || "Programming Language",
            level: skill.level || "Intermediate",
          })),
        });
      } catch (error) {
        console.error("Error loading profile:", error);
        toast.error("Could not load profile data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user]);

  const saveProfile = async (): Promise<string | null> => {
    if (!user) return null;
    const p = data.profile;
    const payload = {
      full_name: p.full_name || null,
      profession: p.profession || null,
      bio: p.bio || null,
      location: p.location || null,
      avatar_url: p.avatar_url || null,
      email_contact: p.email || null,
      linkedin_url: p.linkedin_url || null,
      github_url: p.github_url || null,
      website_url: p.website_url || null,
      twitter_url: p.twitter_url || null,
    };
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(payload)
      .eq("user_id", user.id)
      .select("id")
      .maybeSingle();
    throwIfError(error);
    return updated?.id ?? null;
  };

  const saveEducation = async () => {
    if (!user) return;
    const { error: deleteError } = await supabase
      .from(TABLE.education)
      .delete()
      .eq("user_id", user.id);
    throwIfError(deleteError);

    if (data.education.length === 0) return;

    const { error } = await supabase.from(TABLE.education).insert(
      data.education.map((edu) => ({
        user_id: user.id,
        institution_name: edu.institution_name,
        degree: edu.degree,
        field_of_study: edu.field_of_study || null,
        start_year: edu.start_year || null,
        end_year: edu.end_year || null,
        gpa: edu.gpa != null ? String(edu.gpa) : null,
        description: edu.description || null,
        institution_logo_url: edu.logo_url || null,
      }))
    );
    throwIfError(error);
  };

  const saveExperience = async () => {
    if (!user) return;
    const { error: deleteError } = await supabase
      .from(TABLE.experience)
      .delete()
      .eq("user_id", user.id);
    throwIfError(deleteError);

    if (data.experience.length === 0) return;

    const { error } = await supabase.from(TABLE.experience).insert(
      data.experience.map((exp) => ({
        user_id: user.id,
        job_title: exp.job_title,
        company_name: exp.company_name,
        employment_type: exp.employment_type,
        location: exp.location || null,
        start_date: exp.start_date ? exp.start_date + "-01" : null,
        end_date: exp.is_current ? null : exp.end_date ? exp.end_date + "-01" : null,
        is_current: exp.is_current,
        description: exp.description || null,
        company_logo_url: exp.logo_url || null,
      }))
    );
    throwIfError(error);
  };

  const ensurePortfolio = async () => {
    if (!user) return null;

    const { data: existing, error: selectError } = await supabase
      .from(TABLE.portfolios)
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    throwIfError(selectError);

    if (existing?.id) {
      const { error } = await supabase
        .from(TABLE.portfolios)
        .update({ is_published: true })
        .eq("id", existing.id);
      throwIfError(error);
      return existing.id;
    }

    const { data: inserted, error } = await supabase
      .from(TABLE.portfolios)
      .insert({
        user_id: user.id,
        title: `${data.profile.full_name || "My"} Portfolio`,
        description: data.profile.bio || null,
        is_published: true,
      })
      .select("id")
      .single();
    throwIfError(error);
    return inserted.id;
  };

  const savePortfolio = async () => {
    const portfolioId = await ensurePortfolio();
    if (!portfolioId) return;

    const { error: deleteError } = await supabase
      .from(TABLE.portfolioItems)
      .delete()
      .eq("portfolio_id", portfolioId);
    throwIfError(deleteError);

    if (data.portfolio.length === 0) return;

    const { error } = await supabase.from(TABLE.portfolioItems).insert(
      data.portfolio.map((project) => ({
        portfolio_id: portfolioId,
        type: "Project",
        title: project.title,
        description: project.description || null,
        external_link: project.demo_url || project.repository_url || null,
        tags: [...project.tech_stack, ...(project.year ? [String(project.year)] : [])],
      }))
    );
    throwIfError(error);
  };

  const saveSkills = async (profileId?: string | null) => {
    const id = profileId ?? (await saveProfile());
    if (!id) throw new Error("Profile row was not found");

    const { error: deleteError } = await supabase
      .from(TABLE.skills)
      .delete()
      .eq("profile_id", id);
    throwIfError(deleteError);

    if (data.skills.length === 0) return;

    const { error } = await supabase.from(TABLE.skills).insert(
      data.skills.map((skill) => ({
        profile_id: id,
        name: skill.name,
        category: skill.category,
        level: skill.level,
      }) as any)
    );
    throwIfError(error);
  };

  const saveAll = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const profileId = await saveProfile();
      await saveEducation();
      await saveExperience();
      await savePortfolio();
      await saveSkills(profileId);
      toast.success("Profile saved");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Could not save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadCV = async () => {
    if (!user) return;
    setDownloadingCV(true);
    try {
      const cvData = await fetchCVDataByUserId(user.id, user.email);
      if (!cvData) {
        toast.error("Profile not found");
        return;
      }
      await downloadCV(cvData);
      toast.success("CV downloaded");
    } catch {
      toast.error("Could not generate CV");
    } finally {
      setDownloadingCV(false);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) setCurrentStep((step) => step - 1);
  };

  const goToNextStep = () => {
    if (currentStep < STEPS.length - 1) setCurrentStep((step) => step + 1);
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] min-h-[720px] flex flex-col rounded-md border bg-background overflow-hidden">
        <div className="border-b px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold">Edit Profile</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Update your portfolio using the same guided editor as onboarding.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleDownloadCV} disabled={downloadingCV || loading}>
              {downloadingCV ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Download CV
            </Button>
            <Button size="sm" onClick={saveAll} disabled={saving || loading}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <div className="w-[42%] min-w-[360px] border-r flex flex-col">
              <div className="p-5 border-b">
                <div className="flex justify-between items-center gap-2 mb-4">
                  {STEPS.map((step, idx) => (
                    <button
                      key={step}
                      onClick={() => setCurrentStep(idx)}
                      disabled={saving}
                      className="flex-1 flex flex-col items-center gap-1"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                          idx === currentStep
                            ? "bg-foreground text-background"
                            : idx < currentStep
                              ? "bg-muted-foreground text-background"
                              : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-[11px] font-medium text-center">{step}</span>
                    </button>
                  ))}
                </div>
                <div className="h-0.5 rounded-full bg-muted">
                  <div
                    className="h-0.5 rounded-full bg-foreground transition-all"
                    style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                {currentStep === 0 && (
                  <ProfileStep
                    data={data.profile}
                    onChange={(profile) => setData((prev) => ({ ...prev, profile }))}
                    isLoading={saving}
                  />
                )}
                {currentStep === 1 && (
                  <EducationStep
                    data={data.education}
                    onChange={(education) => setData((prev) => ({ ...prev, education }))}
                    isLoading={saving}
                  />
                )}
                {currentStep === 2 && (
                  <ExperienceStep
                    data={data.experience}
                    onChange={(experience) => setData((prev) => ({ ...prev, experience }))}
                    isLoading={saving}
                  />
                )}
                {currentStep === 3 && (
                  <PortfolioStep
                    data={data.portfolio}
                    onChange={(portfolio) => setData((prev) => ({ ...prev, portfolio }))}
                    isLoading={saving}
                  />
                )}
                {currentStep === 4 && (
                  <SkillsStep
                    data={data.skills}
                    onChange={(skills) => setData((prev) => ({ ...prev, skills }))}
                    isLoading={saving}
                  />
                )}
              </div>

              <div className="border-t px-6 py-4 flex items-center justify-between">
                <Button variant="outline" size="sm" onClick={goToPrevStep} disabled={currentStep === 0 || saving}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <span className="text-xs text-muted-foreground font-medium">
                  {currentStep + 1} / {STEPS.length}
                </span>
                {currentStep === STEPS.length - 1 ? (
                  <Button size="sm" onClick={saveAll} disabled={saving}>
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save
                  </Button>
                ) : (
                  <Button size="sm" onClick={goToNextStep} disabled={saving}>
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="flex-1 bg-muted/40 p-6 overflow-hidden flex flex-col gap-3">
              <CVFormatToolbar format={format} onChange={setFormat} />
              <CVPreview data={data} format={format} />
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EditProfile;
