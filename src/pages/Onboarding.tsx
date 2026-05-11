import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { OnboardingData, ProfileData, EducationEntry, ExperienceEntry, PortfolioEntry, SkillEntry } from '@/types/onboarding';
import { Button } from '@/components/ui/button';
import { ProfileStep } from '@/components/onboarding/ProfileStep';
import { EducationStep } from '@/components/onboarding/EducationStep';
import { ExperienceStep } from '@/components/onboarding/ExperienceStep';
import { PortfolioStep } from '@/components/onboarding/PortfolioStep';
import { SkillsStep } from '@/components/onboarding/SkillsStep';
import { CVPreview } from '@/components/onboarding/CVPreview';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = ['Profile', 'Education', 'Experience', 'Portfolio', 'Skills'] as const;

// ─── Supabase table names used by the rest of the app ────────────────────────
const TABLE = {
  education:  'educations',
  experience: 'experiences',
  portfolios: 'portfolios',
  portfolioItems: 'portfolio_items',
  skills:     'skills',
} as const;

// ─── localStorage keys ───────────────────────────────────────────────────────
const LS_DATA_KEY  = 'onboarding_draft_data';
const LS_STEP_KEY  = 'onboarding_draft_step';

const DEFAULT_PROFILE: ProfileData = {
  full_name: '',
  profession: '',
  bio: '',
  location: '',
  avatar_url: null,
  email: '',
  linkedin_url: '',
  github_url: '',
  website_url: '',
  twitter_url: '',
};

const DEFAULT_DATA: OnboardingData = {
  profile: DEFAULT_PROFILE,
  education: [],
  experience: [],
  portfolio: [],
  skills: [],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function loadDraftData(): OnboardingData {
  try {
    const raw = localStorage.getItem(LS_DATA_KEY);
    if (raw) return JSON.parse(raw) as OnboardingData;
  } catch {
    // ignore parse errors
  }
  return DEFAULT_DATA;
}

function loadDraftStep(): number {
  try {
    const raw = localStorage.getItem(LS_STEP_KEY);
    if (raw !== null) {
      const step = parseInt(raw, 10);
      if (!isNaN(step) && step >= 0 && step < STEPS.length) return step;
    }
  } catch {
    // ignore
  }
  return 0;
}

function clearDraft() {
  try {
    localStorage.removeItem(LS_DATA_KEY);
    localStorage.removeItem(LS_STEP_KEY);
  } catch {
    // ignore
  }
}

function throwIfError(error: unknown) {
  if (error) throw error;
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function Onboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Initialise from localStorage so a refresh/tab-switch doesn't wipe inputs
  const [currentStep, setCurrentStep] = useState<number>(loadDraftStep);
  const [data, setData] = useState<OnboardingData>(loadDraftData);
  const [isSaving, setIsSaving]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Track whether we have already merged Supabase data once so we don't
  // overwrite localStorage edits on subsequent re-renders.
  const supabaseMergedRef = useRef(false);

  // ── Auth guard ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (authLoading) return;
    if (!user) navigate('/login', { replace: true });
  }, [user, authLoading, navigate]);

  // ── Auto-save data to localStorage on every change ─────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(LS_DATA_KEY, JSON.stringify(data));
    } catch {
      // Storage quota exceeded – silently ignore
    }
  }, [data]);

  // ── Auto-save step to localStorage on every change ─────────────────────────
  useEffect(() => {
    try {
      localStorage.setItem(LS_STEP_KEY, String(currentStep));
    } catch {
      // ignore
    }
  }, [currentStep]);

  // ── Load existing data from Supabase (only once, merge into draft) ──────────
  useEffect(() => {
    if (!user || supabaseMergedRef.current) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        // Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        throwIfError(profileError);

        // Education
        const { data: educationData, error: educationError } = await (supabase
          .from(TABLE.education as any)
          .select('*')
          .eq('user_id', user.id) as any);
        throwIfError(educationError);

        // Experience
        const { data: experienceData, error: experienceError } = await (supabase
          .from(TABLE.experience as any)
          .select('*')
          .eq('user_id', user.id) as any);
        throwIfError(experienceError);

        // Portfolio projects are stored as items under the user's portfolio.
        const { data: portfoliosData, error: portfoliosError } = await supabase
          .from(TABLE.portfolios)
          .select('id')
          .eq('user_id', user.id);
        throwIfError(portfoliosError);

        const portfolioIds = (portfoliosData ?? []).map((portfolio) => portfolio.id);
        const { data: portfolioData, error: portfolioItemsError } = portfolioIds.length > 0
          ? await supabase
              .from(TABLE.portfolioItems)
              .select('*')
              .in('portfolio_id', portfolioIds)
          : { data: [], error: null };
        throwIfError(portfolioItemsError);

        // Skills
        const { data: skillsData, error: skillsError } = profileData?.id
          ? await supabase
              .from(TABLE.skills)
              .select('*')
              .eq('profile_id', profileData.id)
          : { data: [], error: null };
        throwIfError(skillsError);

        // Merge Supabase data with whatever is already in the draft.
        // localStorage draft takes priority for fields the user has typed;
        // Supabase fills in the rest (e.g. first visit after email confirm).
        setData((prev) => {
          const draft = prev;

          const mergedProfile: ProfileData = profileData
            ? {
                full_name:    draft.profile.full_name    || profileData.full_name    || '',
                profession:   draft.profile.profession   || profileData.profession   || '',
                bio:          draft.profile.bio          || profileData.bio          || '',
                location:     draft.profile.location     || profileData.location     || '',
                avatar_url:   draft.profile.avatar_url   ?? profileData.avatar_url   ?? null,
                email:        draft.profile.email        || profileData.email_contact || user.email || '',
                linkedin_url: draft.profile.linkedin_url || profileData.linkedin_url || '',
                github_url:   draft.profile.github_url   || profileData.github_url   || '',
                website_url:  draft.profile.website_url  || profileData.website_url  || '',
                twitter_url:  draft.profile.twitter_url  || profileData.twitter_url  || '',
              }
            : { ...draft.profile, email: draft.profile.email || user.email || '' };

          const mergedEducation: EducationEntry[] =
            draft.education.length > 0
              ? draft.education
              : (educationData ?? []).map((edu: any) => ({
                  id:               edu.id,
                  institution_name: edu.institution_name || '',
                  degree:           edu.degree           || '',
                  field_of_study:   edu.field_of_study   || '',
                  start_year:       edu.start_year       || 0,
                  end_year:         edu.end_year         || 0,
                  gpa:              edu.gpa ? parseFloat(edu.gpa) : undefined,
                  description:      edu.description      || '',
                  logo_url:         edu.institution_logo_url,
                }));

          const mergedExperience: ExperienceEntry[] =
            draft.experience.length > 0
              ? draft.experience
              : (experienceData ?? []).map((exp: any) => ({
                  id:              exp.id,
                  job_title:       exp.job_title       || '',
                  company_name:    exp.company_name    || '',
                  employment_type: exp.employment_type || 'Full-time',
                  location:        exp.location        || '',
                  start_date:      exp.start_date ? exp.start_date.slice(0,7) : '',
                  end_date:        exp.end_date ? exp.end_date.slice(0,7) : null,
                  is_current:      exp.is_current      || false,
                  description:     exp.description     || '',
                  logo_url:        exp.company_logo_url,
                }));

          const mergedPortfolio: PortfolioEntry[] =
            draft.portfolio.length > 0
              ? draft.portfolio
              : (portfolioData ?? []).map((proj: any) => ({
                  id:             proj.id,
                  title:          proj.title       || '',
                  description:    proj.description || '',
                  tech_stack:     proj.tags || [],
                  demo_url:       proj.external_link || undefined,
                  repository_url: undefined,
                  year:           new Date(proj.created_at || Date.now()).getFullYear(),
                }));

          const mergedSkills: SkillEntry[] =
            draft.skills.length > 0
              ? draft.skills
              : (skillsData ?? []).map((skill: any) => ({
                  id:       skill.id,
                  name:     skill.name     || '',
                  category: skill.category || 'Programming Language',
                  level:    skill.level    || 'Intermediate',
                }));

          return {
            profile:    mergedProfile,
            education:  mergedEducation,
            experience: mergedExperience,
            portfolio:  mergedPortfolio,
            skills:     mergedSkills,
          };
        });

        supabaseMergedRef.current = true;
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load your data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user]);

  const saveProfile = async (completed = false) => {
    if (!user) return null;

    const { data: profileRow, error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          full_name: data.profile.full_name,
          profession: data.profile.profession,
          bio: data.profile.bio,
          location: data.profile.location,
          avatar_url: data.profile.avatar_url,
          email_contact: data.profile.email || user.email || null,
          linkedin_url: data.profile.linkedin_url,
          github_url: data.profile.github_url,
          website_url: data.profile.website_url,
          twitter_url: data.profile.twitter_url,
          onboarding_completed: completed,
        },
        { onConflict: 'user_id' }
      )
      .select('id')
      .single();

    throwIfError(error);
    return profileRow.id;
  };

  const saveEducation = async () => {
    if (!user) return;
    const { error: deleteError } = await supabase
      .from(TABLE.education)
      .delete()
      .eq('user_id', user.id);
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
      .eq('user_id', user.id);
    throwIfError(deleteError);

    if (data.experience.length === 0) return;

    const { error } = await supabase.from(TABLE.experience).insert(
      data.experience.map((exp) => ({
        user_id: user.id,
        job_title: exp.job_title,
        company_name: exp.company_name,
        employment_type: exp.employment_type,
        location: exp.location || null,
        start_date: exp.start_date ? exp.start_date + '-01' : null,
        end_date: exp.is_current ? null : exp.end_date ? exp.end_date + '-01' : null,
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
      .select('id')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();
    throwIfError(selectError);

    if (existing?.id) {
      const { error } = await supabase
        .from(TABLE.portfolios)
        .update({ is_published: true })
        .eq('id', existing.id);
      throwIfError(error);
      return existing.id;
    }

    const { data: inserted, error } = await supabase
      .from(TABLE.portfolios)
      .insert({
        user_id: user.id,
        title: `${data.profile.full_name || 'My'} Portfolio`,
        description: data.profile.bio || null,
        is_published: true,
      })
      .select('id')
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
      .eq('portfolio_id', portfolioId);
    throwIfError(deleteError);

    if (data.portfolio.length === 0) return;

    const { error } = await supabase.from(TABLE.portfolioItems).insert(
      data.portfolio.map((proj) => ({
        portfolio_id: portfolioId,
        type: 'Project',
        title: proj.title,
        description: proj.description || null,
        external_link: proj.demo_url || proj.repository_url || null,
        tags: [
          ...proj.tech_stack,
          ...(proj.year ? [String(proj.year)] : []),
        ],
      }))
    );
    throwIfError(error);
  };

  const saveSkills = async (profileId?: string | null) => {
    if (!user) return;
    const id = profileId ?? (await saveProfile(false));
    if (!id) throw new Error('Profile row was not found');

    const { error: deleteError } = await supabase
      .from(TABLE.skills)
      .delete()
      .eq('profile_id', id);
    throwIfError(deleteError);

    if (data.skills.length === 0) return;

    const { error } = await supabase.from(TABLE.skills).insert(
      data.skills.map((skill) => ({
        profile_id: id,
        name: skill.name,
        category: skill.category,
      }))
    );
    throwIfError(error);
  };

  // ── Save ALL steps to Supabase (used by handleFinish) ─────────────────────
  const saveAllSteps = async () => {
    const profileId = await saveProfile(true);
    await saveEducation();
    await saveExperience();
    await savePortfolio();
    await saveSkills(profileId);
  };

  // ── Save current step to Supabase ──────────────────────────────────────────
  const saveCurrentStep = async () => {
    if (!user) return false;
    setIsSaving(true);
    try {
      switch (currentStep) {
        case 0:
          await saveProfile(false);
          break;
        case 1:
          await saveEducation();
          break;
        case 2:
          await saveExperience();
          break;
        case 3:
          await savePortfolio();
          break;
        case 4:
          await saveSkills();
          break;
      }

      toast.success('Changes saved');
      return true;
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goToNextStep = async () => {
    const saved = await saveCurrentStep();
    if (saved && currentStep < STEPS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const handleFinish = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      await saveAllSteps();
      clearDraft();
      toast.success('Profile completed!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Error saving:', error);
      toast.error('Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  // ── Loading screen ─────────────────────────────────────────────────────────
  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-8 py-4">
        <h1 className="text-lg font-bold text-gray-900 dark:text-gray-50">
          Complete Your Profile
        </h1>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Build your professional CV as you fill in your information
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column – Form */}
        <div className="w-[42%] border-r border-gray-200 dark:border-gray-800 flex flex-col bg-white dark:bg-gray-900">
          {/* Progress Indicator */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-800">
            <div className="flex justify-between items-center gap-2 mb-4">
              {STEPS.map((step, idx) => (
                <div key={step} className="flex-1">
                  <button
                    onClick={() => handleStepClick(idx)}
                    className="flex flex-col items-center w-full gap-1"
                    disabled={isSaving}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                        idx === currentStep
                          ? 'bg-gray-900 dark:bg-gray-50 text-white dark:text-gray-900'
                          : idx < currentStep
                          ? 'bg-gray-400 dark:bg-gray-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-xs font-medium text-center">
                      {step}
                    </span>
                  </button>
                </div>
              ))}
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-0.5 rounded-full">
              <div
                className="bg-gray-900 dark:bg-gray-50 h-0.5 rounded-full transition-all"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {currentStep === 0 && (
              <ProfileStep
                data={data.profile}
                onChange={(profile) => setData((prev) => ({ ...prev, profile }))}
                isLoading={isSaving}
              />
            )}
            {currentStep === 1 && (
              <EducationStep
                data={data.education}
                onChange={(education) => setData((prev) => ({ ...prev, education }))}
                isLoading={isSaving}
              />
            )}
            {currentStep === 2 && (
              <ExperienceStep
                data={data.experience}
                onChange={(experience) => setData((prev) => ({ ...prev, experience }))}
                isLoading={isSaving}
              />
            )}
            {currentStep === 3 && (
              <PortfolioStep
                data={data.portfolio}
                onChange={(portfolio) => setData((prev) => ({ ...prev, portfolio }))}
                isLoading={isSaving}
              />
            )}
            {currentStep === 4 && (
              <SkillsStep
                data={data.skills}
                onChange={(skills) => setData((prev) => ({ ...prev, skills }))}
                isLoading={isSaving}
              />
            )}
          </div>

          {/* Navigation Footer */}
          <div className="border-t border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
            <Button
              onClick={goToPrevStep}
              variant="outline"
              disabled={currentStep === 0 || isSaving}
              size="sm"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back
            </Button>

            <span className="text-xs text-gray-600 dark:text-gray-400 font-medium">
              {currentStep + 1} / {STEPS.length}
            </span>

            {currentStep === STEPS.length - 1 ? (
              <Button onClick={handleFinish} disabled={isSaving} size="sm">
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save & Complete ✓
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={goToNextStep} disabled={isSaving} size="sm">
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Next →
                    <ArrowRight size={16} className="ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Right Column – CV Preview */}
        <div className="w-[58%] bg-gray-50 dark:bg-gray-800 p-6 overflow-hidden flex flex-col">
          <CVPreview data={data} />
        </div>
      </div>
    </div>
  );
}
