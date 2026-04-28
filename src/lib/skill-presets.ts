// Preset expertise categories & skills shown in EditSkillsDialog.
// Categories here MUST stay in sync with the icons handled in
// `src/components/portfolio/ExpertiseSection.tsx` so each card gets an icon.

export interface SkillPresetCategory {
  category: string;
  description: string;
  skills: string[];
}

export const SKILL_PRESETS: SkillPresetCategory[] = [
  {
    category: "Web Development",
    description:
      "Modern, responsive websites built to scale and help businesses grow online.",
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
    ],
  },
  {
    category: "Mobile App Development",
    description:
      "Smooth, reliable mobile apps tailored to deliver a great user experience.",
    skills: [
      "React Native",
      "Flutter",
      "Kotlin",
      "Swift",
      "Android",
      "iOS",
      "Expo",
    ],
  },
  {
    category: "Desktop App Development",
    description:
      "Desktop software that is efficient, secure, and ready to solve real-world challenges.",
    skills: ["Electron", "Tauri", ".NET", "Qt", "JavaFX", "C++"],
  },
  {
    category: "Machine Learning",
    description:
      "Smart predictions and automation to help businesses make faster, better decisions.",
    skills: [
      "Python",
      "TensorFlow",
      "PyTorch",
      "scikit-learn",
      "Pandas",
      "NumPy",
      "OpenCV",
    ],
  },
  {
    category: "DevOps & Cloud",
    description:
      "Cloud-native infrastructure with automated workflows and strong reliability.",
    skills: [
      "Docker",
      "Kubernetes",
      "AWS",
      "GCP",
      "Azure",
      "Terraform",
      "CI/CD",
      "Linux",
    ],
  },
  {
    category: "Networking & Security",
    description:
      "Secure IT systems with a solid foundation — fast, stable, and protected networks.",
    skills: [
      "TCP/IP",
      "Firewalls",
      "VPN",
      "Penetration Testing",
      "OWASP",
      "Cisco",
      "Cryptography",
    ],
  },
  {
    category: "Backend & Database",
    description: "APIs, services, and databases that power reliable applications.",
    skills: [
      "PostgreSQL",
      "MySQL",
      "MongoDB",
      "Redis",
      "REST API",
      "GraphQL",
      "Supabase",
      "Firebase",
    ],
  },
  {
    category: "Design (UI/UX)",
    description: "Clean interfaces and thoughtful user experiences.",
    skills: [
      "Figma",
      "Adobe XD",
      "Photoshop",
      "Illustrator",
      "Wireframing",
      "Prototyping",
      "Design Systems",
    ],
  },
  {
    category: "Business & Management",
    description: "Product management, planning, and team leadership.",
    skills: [
      "Agile",
      "Scrum",
      "Kanban",
      "Jira",
      "Notion",
      "Product Strategy",
      "Roadmapping",
    ],
  },
];
