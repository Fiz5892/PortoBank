// Common professional skills used as autocomplete suggestions across professions.
export const SUGGESTED_SKILLS = [
  // Tech
  "JavaScript", "TypeScript", "React", "Node.js", "Python", "SQL", "AWS",
  // Design
  "Figma", "UI Design", "UX Research", "Branding", "Illustration", "Adobe Photoshop", "Adobe Illustrator",
  // Business
  "Project Management", "Marketing", "SEO", "Copywriting", "Public Speaking", "Sales", "Negotiation",
  // Creative / Media
  "Photography", "Video Editing", "Music Production", "Storytelling",
  // Healthcare
  "Patient Care", "Clinical Research", "First Aid",
  // Trades / Other
  "Cooking", "Carpentry", "Teaching", "Translation",
  // Soft skills
  "Leadership", "Team Management", "Communication", "Problem Solving", "Time Management",
];

// Suggest a username slug from a full name
export const slugifyName = (name: string): string => {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 24);
};
