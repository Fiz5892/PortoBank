import { useEffect, useState, useRef } from 'react';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
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
import { ArrowLeft, ArrowRight, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { downloadCV } from '@/lib/cv-pdf';

const STEPS = ['Profile', 'Education', 'Experience', 'Portfolio', 'Skills'] as const;

const TABLE = {
  education:  'educations',
  experience: 'experiences',
  portfolios: 'portfolios',
  portfolioItems: 'portfolio_items',
  skills:     'skills',
} as const;

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

function throwIfError(error: unknown) {
  if (error) throw error;
}

const EditProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [data, setData] = useState<OnboardingData>(DEFAULT_DATA);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingCV, setDownloadingCV] = useState(false);
  const supabaseMergedRef = useRef(false);

  useEffect(() => {
    if (!user || supabaseMergedRef.current) return;

    const loadData = async () => {
      setIsLoading(true);
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
        throwIfError(profileError);

        const { data: educationData, error: educationError } = await supabase
          .from(TABLE.education)
          .select('*')
          .eq('user_id', user.id);
        throwIfError(educationError);

        const { data: experienceData, error: experienceError } = await supabase
          .from(TABLE.experience)
          .select('*')
          .eq('user_id', user.id);
        throwIfError(experienceError);

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

        const { data: skillsData, error: skillsError } = profileData?.id
          ? await supabase
              .from(TABLE.skills)
              .select('*')
              .eq('profile_id', profileData.id)
          : { data: [], error: null };
        throwIfError(skillsError);

        setData({
          profile: profileData ? {
            full_name: profileData.full_name || '',
            profession: profileData.profession || '',
            bio: profileData.bio || '',
            location: profileData.location || '',
            avatar_url: profileData.avatar_url ?? null,
            email: profileData.email_contact || user.email || '',
            linkedin_url: profileData.linkedin_url || '',
            github_url: profileData.github_url || '',
            website_url: profileData.website_url || '',
            twitter_url: profileData.twitter_url || '',
          } : { ...DEFAULT_PROFILE, email: user.email || '' },
          education: (educationData ?? []).map((edu: any) => ({
            id: edu.id,
            institution_name: edu.institution_name || '',
            degree: edu.degree || '',
            field_of_study: edu.field_of_study || '',
            start_year: edu.start_year || 0,
            end_year: edu.end_year || 0,
            gpa: edu.gpa ? parseFloat(edu.gpa) : undefined,
            description: edu.description || '',
            logo_url: edu.institution_logo_url,
          })),
          experience: (experienceData ?? []).map((exp: any) => ({
            id: exp.id,
            job_title: exp.job_title || '',
            company_name: exp.company_name || '',
            employment_type: exp.employment_type || 'Full-time',
            location: exp.location || '',
            start_date: exp.start_date ? exp.start_date.slice(0, 7) : '',
            end_date: exp.end_date ? exp.end_date.slice(0, 7) : null,
            is_current: exp.is_current || false,
            description: exp.description || '',
            logo_url: exp.company_logo_url,
          })),
          portfolio: (portfolioData ?? []).map((proj: any) => ({
            id: proj.id,
            title: proj.title || '',
            description: proj.description || '',
            tech_stack: proj.tags || [],
            demo_url: proj.external_link || undefined,
            repository_url: undefined,
            year: new Date(proj.created_at || Date.now()).getFullYear(),
          })),
          skills: (skillsData ?? []).map((skill: any) => ({
            id: skill.id,
            name: skill.name || '',
            category: skill.category || 'Programming Language',
            level: skill.level || 'Intermediate',
          })),
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
          onboarding_completed: completed || true,
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
    const { error: deleteError } = await supabase.from(TABLE.education).delete().eq('user_id', user.id);
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
    const { error: deleteError } = await supabase.from(TABLE.experience).delete().eq('user_id', user.id);
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
      const { error } = await supabase.from(TABLE.portfolios).update({ is_published: true }).eq('id', existing.id);
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
    const { error: deleteError } = await supabase.from(TABLE.portfolioItems).delete().eq('portfolio_id', portfolioId);
    throwIfError(deleteError);
    if (data.portfolio.length === 0) return;
    const { error } = await supabase.from(TABLE.portfolioItems).insert(
      data.portfolio.map((proj) => ({
        portfolio_id: portfolioId,
        type: 'Project',
        title: proj.title,
        description: proj.description || null,
        external_link: proj.demo_url || proj.repository_url || null,
        tags: [...proj.tech_stack, ...(proj.year ? [String(proj.year)] : [])],
      }))
    );
    throwIfError(error);
  };

  const saveSkills = async (profileId?: string | null) => {
    if (!user) return;
    const id = profileId ?? (await saveProfile(true));
    if (!id) throw new Error('Profile row was not found');
    const { error: deleteError } = await supabase.from(TABLE.skills).delete().eq('profile_id', id);
    throwIfError(deleteError);
    if (data.skills.length === 0) return;
    const { error } = await supabase.from(TABLE.skills).insert(
      data.skills.map((skill) => ({
        profile_id: id,
        name: skill.name,
        category: skill.category,
        level: skill.level || 'Intermediate',
      }))
    );
    throwIfError(error);
  };

  const saveCurrentStep = async () => {
    if (!user) return false;
    setIsSaving(true);
    try {
      switch (currentStep) {
        case 0: await saveProfile(true); break;
        case 1: await saveEducation(); break;
        case 2: await saveExperience(); break;
        case 3: await savePortfolio(); break;
        case 4: await saveSkills(); break;
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
    const saved = await saveCurrentStep();
    if (saved) {
      toast.success('Profile updated successfully!');
    }
  };

  const handleStepClick = async (step: number) => {
    if (step !== currentStep) {
      await saveCurrentStep();
      setCurrentStep(step);
    }
  };

  const handleDownloadCV = async () => {
    if (!user) return;
    setDownloadingCV(true);
    try {
      await downloadCV(data);
      toast.success("CV downloaded");
    } catch (e) {
      toast.error("Could not generate CV");
    } finally {
      setDownloadingCV(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-100px)] lg:flex-row gap-6">
        {/* Left Column – Form */}
        <div className="w-full lg:w-[42%] flex flex-col bg-white dark:bg-gray-900 border rounded-xl overflow-hidden shrink-0 shadow-subtle">
          {/* Progress Indicator */}
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
            <div className="flex justify-between items-center gap-1 sm:gap-2 mb-4">
              {STEPS.map((step, idx) => (
                <div key={step} className="flex-1">
                  <button
                    onClick={() => handleStepClick(idx)}
                    className="flex flex-col items-center w-full gap-1"
                    disabled={isSaving}
                  >
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-semibold transition-all ${
                        idx === currentStep
                          ? 'bg-primary text-primary-foreground'
                          : idx < currentStep
                          ? 'bg-primary/60 text-primary-foreground'
                          : 'bg-secondary text-muted-foreground'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <span className="text-[10px] sm:text-xs font-medium text-center hidden sm:block">
                      {step}
                    </span>
                  </button>
                </div>
              ))}
            </div>
            <div className="w-full bg-secondary h-1 rounded-full overflow-hidden">
              <div
                className="bg-primary h-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-card">
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
          <div className="border-t border-gray-200 dark:border-gray-800 p-4 shrink-0 flex flex-wrap items-center justify-between gap-3 bg-muted/30">
            <Button
              onClick={goToPrevStep}
              variant="outline"
              disabled={currentStep === 0 || isSaving}
              size="sm"
            >
              <ArrowLeft size={16} className="mr-1.5" />
              Back
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadCV}
              disabled={downloadingCV || isSaving}
              className="lg:hidden"
            >
              {downloadingCV ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} className="mr-1.5" />}
              Download CV
            </Button>

            {currentStep === STEPS.length - 1 ? (
              <Button onClick={handleFinish} disabled={isSaving} size="sm">
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save All
                  </>
                )}
              </Button>
            ) : (
              <Button onClick={goToNextStep} disabled={isSaving} size="sm">
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="mr-1.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save & Next
                    <ArrowRight size={16} className="ml-1.5" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Right Column – CV Preview */}
        <div className="hidden lg:flex lg:w-[58%] bg-gray-50 dark:bg-gray-800 p-6 rounded-xl border overflow-hidden flex-col">
          <CVPreview data={data} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default EditProfile;
