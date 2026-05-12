export interface OnboardingData {
  profile: ProfileData;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  portfolio: PortfolioEntry[];
  skills: SkillEntry[];
}

export interface ProfileData {
  full_name: string;
  profession: string;
  bio: string;
  location: string;
  avatar_url: string | null;
  email: string;
  linkedin_url: string;
  github_url: string;
  website_url: string;
  twitter_url: string;
}

export interface EducationEntry {
  id: string;
  institution_name: string;
  degree: string;
  field_of_study: string;
  start_year: number;
  end_year: number;
  gpa?: number;
  description: string;
  logo_url?: string;
}

export interface ExperienceEntry {
  id: string;
  job_title: string;
  company_name: string;
  employment_type: 'Full-time' | 'Part-time' | 'Freelance' | 'Internship' | 'Contract' | 'Volunteer';
  location: string;
  start_date: string; // "YYYY-MM"
  end_date: string | null; // "YYYY-MM" or null if current
  is_current: boolean;
  description: string;
  logo_url?: string;
}

export interface PortfolioEntry {
  id: string;
  title: string;
  description: string;
  tech_stack: string[]; // comma-separated to array
  demo_url?: string;
  repository_url?: string;
  year: number;
}

export interface SkillEntry {
  id: string;
  name: string;
  category: 'Programming Language' | 'Framework & Library' | 'Design Tool' | 'Database' | 'DevOps & Cloud' | 'Soft Skill' | 'Bahasa' | 'Lainnya';
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
}
