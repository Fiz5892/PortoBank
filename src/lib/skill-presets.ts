// Preset expertise categories & skills shown in EditSkillsDialog and ExpertiseSection.
// Designed to cover many professions, not only IT.
//
// `icon` is a Lucide icon name (PascalCase) used as the category visual on the
// public portfolio Expertise grid. `description` is a short, first-person blurb
// rendered under the category title.

import type { LucideIcon } from "lucide-react";
import {
  Palette,
  Camera,
  PenTool,
  Megaphone,
  Briefcase,
  Calculator,
  Handshake,
  GraduationCap,
  HeartPulse,
  Wrench,
  UtensilsCrossed,
  Music,
  Globe,
  Smartphone,
  Monitor,
  Brain,
  Cloud,
  Network,
  BarChart3,
  Languages,
  Scale,
  Sparkles,
  Hammer,
  Plane,
} from "lucide-react";

export interface SkillPresetCategory {
  category: string;
  description: string;
  icon: LucideIcon;
  skills: string[];
}

export const SKILL_PRESETS: SkillPresetCategory[] = [
  {
    category: "Design & Creative",
    icon: Palette,
    description:
      "I craft thoughtful visuals and brand experiences that help ideas look as good as they work.",
    skills: [
      "Graphic Design",
      "UI Design",
      "UX Design",
      "Branding",
      "Illustration",
      "Logo Design",
      "Typography",
      "Figma",
      "Adobe Photoshop",
      "Adobe Illustrator",
      "Canva",
      "Print Design",
    ],
  },
  {
    category: "Photography & Video",
    icon: Camera,
    description:
      "I capture moments and produce visual stories that make brands and people feel real.",
    skills: [
      "Portrait Photography",
      "Wedding Photography",
      "Product Photography",
      "Event Photography",
      "Photo Editing",
      "Lightroom",
      "Videography",
      "Video Editing",
      "Color Grading",
      "Motion Graphics",
      "Adobe Premiere",
      "DaVinci Resolve",
    ],
  },
  {
    category: "Writing & Content",
    icon: PenTool,
    description:
      "I write clear, engaging content that connects with people and moves ideas forward.",
    skills: [
      "Copywriting",
      "Content Writing",
      "Blogging",
      "Editing",
      "Proofreading",
      "Translation",
      "Storytelling",
      "Technical Writing",
      "Scriptwriting",
      "SEO Writing",
      "Journalism",
    ],
  },
  {
    category: "Marketing",
    icon: Megaphone,
    description:
      "I help brands grow by reaching the right audience with the right message at the right time.",
    skills: [
      "Digital Marketing",
      "Social Media",
      "SEO",
      "SEM / Google Ads",
      "Email Marketing",
      "Content Strategy",
      "Influencer Marketing",
      "Brand Strategy",
      "Market Research",
      "Marketing Analytics",
      "Public Relations",
    ],
  },
  {
    category: "Business & Management",
    icon: Briefcase,
    description:
      "I lead teams, plan strategically, and turn ideas into outcomes that move organizations forward.",
    skills: [
      "Project Management",
      "Product Management",
      "Operations",
      "Leadership",
      "Strategy",
      "Negotiation",
      "Public Speaking",
      "Agile / Scrum",
      "Consulting",
      "Entrepreneurship",
      "Stakeholder Management",
    ],
  },
  {
    category: "Finance & Accounting",
    icon: Calculator,
    description:
      "I keep the numbers honest and the decisions sound, from daily books to long-term planning.",
    skills: [
      "Accounting",
      "Bookkeeping",
      "Financial Analysis",
      "Auditing",
      "Tax",
      "Budgeting",
      "Payroll",
      "Investment Analysis",
      "Excel",
      "QuickBooks",
      "SAP",
    ],
  },
  {
    category: "Sales & Customer Service",
    icon: Handshake,
    description:
      "I build trust with customers, close deals with care, and make every interaction count.",
    skills: [
      "B2B Sales",
      "Retail Sales",
      "Customer Support",
      "CRM",
      "Lead Generation",
      "Account Management",
      "Cold Calling",
      "Negotiation",
      "Client Onboarding",
    ],
  },
  {
    category: "Education & Training",
    icon: GraduationCap,
    description:
      "I teach, mentor, and design learning experiences that genuinely help people grow.",
    skills: [
      "Teaching",
      "Tutoring",
      "Curriculum Design",
      "Public Speaking",
      "Mentoring",
      "Coaching",
      "E-Learning",
      "Workshop Facilitation",
      "Lesson Planning",
    ],
  },
  {
    category: "Healthcare",
    icon: HeartPulse,
    description:
      "I care for people's health and wellbeing with skill, empathy, and steady professionalism.",
    skills: [
      "Nursing",
      "Patient Care",
      "First Aid",
      "Medical Records",
      "Pharmacy",
      "Physiotherapy",
      "Nutrition",
      "Mental Health Support",
      "Caregiving",
    ],
  },
  {
    category: "Engineering",
    icon: Wrench,
    description:
      "I solve real-world problems with engineering principles, precision, and practical thinking.",
    skills: [
      "Mechanical Engineering",
      "Electrical Engineering",
      "Civil Engineering",
      "Industrial Engineering",
      "CAD / AutoCAD",
      "SolidWorks",
      "Project Estimation",
      "Quality Control",
    ],
  },
  {
    category: "Trades & Craftsmanship",
    icon: Hammer,
    description:
      "I build, repair, and create with my hands — work you can see, touch, and rely on.",
    skills: [
      "Welding",
      "Carpentry",
      "Plumbing",
      "Electrical Work",
      "Automotive Repair",
      "Masonry",
      "HVAC",
      "Painting",
    ],
  },
  {
    category: "Hospitality & Culinary",
    icon: UtensilsCrossed,
    description:
      "I create warm guest experiences and food that people remember long after they leave.",
    skills: [
      "Cooking",
      "Baking",
      "Pastry",
      "Barista",
      "Bartending",
      "Hotel Management",
      "Event Planning",
      "Customer Hospitality",
      "Menu Design",
    ],
  },
  {
    category: "Music & Performing Arts",
    icon: Music,
    description:
      "I perform, compose, and bring stories to life on stage and through sound.",
    skills: [
      "Singing",
      "Songwriting",
      "Music Production",
      "Guitar",
      "Piano",
      "Violin",
      "DJing",
      "Acting",
      "Dancing",
      "Theatre",
    ],
  },
  {
    category: "Web Development",
    icon: Globe,
    description:
      "I craft modern, responsive websites that don't just look good — they're built to scale.",
    skills: [
      "HTML",
      "CSS",
      "JavaScript",
      "TypeScript",
      "React",
      "Next.js",
      "Vue",
      "Tailwind CSS",
      "Node.js",
      "Laravel",
      "PHP",
      "WordPress",
    ],
  },
  {
    category: "Mobile App Development",
    icon: Smartphone,
    description:
      "I create mobile apps that are smooth, reliable, and tailored to a great user experience.",
    skills: [
      "React Native",
      "Flutter",
      "Swift",
      "Kotlin",
      "iOS Development",
      "Android Development",
      "Mobile UI",
    ],
  },
  {
    category: "Desktop & Software",
    icon: Monitor,
    description:
      "I build desktop software that is efficient, secure, and ready to solve real business challenges.",
    skills: [
      "C++",
      "C#",
      ".NET",
      "Java",
      "Python",
      "Electron",
      "Qt",
      "Go",
      "Rust",
    ],
  },
  {
    category: "Data & AI",
    icon: Brain,
    description:
      "I turn complex data into smart predictions and insights that help teams decide faster and better.",
    skills: [
      "Data Analysis",
      "Data Visualization",
      "SQL",
      "Power BI",
      "Tableau",
      "Machine Learning",
      "Pandas",
      "TensorFlow",
      "PyTorch",
      "Statistics",
    ],
  },
  {
    category: "DevOps & Cloud",
    icon: Cloud,
    description:
      "I keep applications running smoothly with cloud-native infrastructure, automation, and reliability.",
    skills: [
      "AWS",
      "Google Cloud",
      "Azure",
      "Docker",
      "Kubernetes",
      "CI/CD",
      "Linux",
      "Terraform",
      "Monitoring",
    ],
  },
  {
    category: "Networking & Security",
    icon: Network,
    description:
      "I design and secure IT systems with a solid foundation — fast, stable, and protected.",
    skills: [
      "Network Administration",
      "Cybersecurity",
      "Penetration Testing",
      "Firewalls",
      "VPN",
      "Cisco",
      "Information Security",
    ],
  },
  {
    category: "Legal & Compliance",
    icon: Scale,
    description:
      "I navigate rules and contracts to keep people, deals, and organizations on solid ground.",
    skills: [
      "Contract Law",
      "Corporate Law",
      "Compliance",
      "Legal Research",
      "Intellectual Property",
      "Notary",
      "Mediation",
    ],
  },
  {
    category: "Beauty & Wellness",
    icon: Sparkles,
    description:
      "I help people look and feel their best through skilled, personal, and caring services.",
    skills: [
      "Hair Styling",
      "Makeup Artistry",
      "Skincare",
      "Massage Therapy",
      "Yoga",
      "Personal Training",
      "Nail Art",
    ],
  },
  {
    category: "Travel & Tourism",
    icon: Plane,
    description:
      "I plan trips and guide experiences that turn travel into something genuinely memorable.",
    skills: [
      "Tour Guiding",
      "Travel Planning",
      "Hospitality",
      "Ticketing",
      "Cultural Knowledge",
    ],
  },
  {
    category: "Analytics & Research",
    icon: BarChart3,
    description:
      "I dig into data and behavior to uncover patterns that help teams act with confidence.",
    skills: [
      "Market Research",
      "User Research",
      "Survey Design",
      "Excel",
      "SPSS",
      "Qualitative Research",
      "Quantitative Research",
    ],
  },
  {
    category: "Languages",
    icon: Languages,
    description:
      "Languages I speak or write fluently and use to connect with people across cultures.",
    skills: [
      "English",
      "Indonesian",
      "Mandarin",
      "Japanese",
      "Korean",
      "Arabic",
      "Spanish",
      "French",
      "German",
    ],
  },
];
