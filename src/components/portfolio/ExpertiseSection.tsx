import { Card } from "@/components/ui/card";
import SectionEditButton from "./SectionEditButton";
import { SKILL_PRESETS } from "@/lib/skill-presets";
import {
  Globe,
  Smartphone,
  Monitor,
  BrainCircuit,
  Cloud,
  Network,
  Sparkles,
  Code2,
  Database,
  Palette,
  Shield,
  Briefcase,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SkillRow {
  name: string;
  category: string | null;
}

interface Props {
  skills: SkillRow[];
  isOwner: boolean;
  onEdit: () => void;
}

const iconForCategory = (cat: string): LucideIcon => {
  const c = cat.toLowerCase();
  if (/(web|frontend|front-end|html|css)/.test(c)) return Globe;
  if (/(mobile|ios|android|flutter|native)/.test(c)) return Smartphone;
  if (/(desktop|windows|mac|linux app)/.test(c)) return Monitor;
  if (/(machine learning|ml|ai|data science)/.test(c)) return BrainCircuit;
  if (/(devops|cloud|aws|gcp|azure|docker|k8s|kubernetes)/.test(c)) return Cloud;
  if (/(network|security|cyber)/.test(c)) return Network;
  if (/(backend|api|server|database|db)/.test(c)) return Database;
  if (/(design|ui|ux|figma)/.test(c)) return Palette;
  if (/(qa|test|quality)/.test(c)) return Shield;
  if (/(programming|language|code)/.test(c)) return Code2;
  if (/(business|management|pm|product)/.test(c)) return Briefcase;
  return Sparkles;
};

// Map preset category -> description (what to show under the title)
const presetDescription = new Map<string, string>(
  SKILL_PRESETS.map((g) => [g.category, g.description]),
);

const ExpertiseSection = ({ skills, isOwner, onEdit }: Props) => {
  // Group by category — only show categories that have at least 1 skill
  const groups = skills.reduce<Record<string, SkillRow[]>>((acc, s) => {
    const key = s.category?.trim() || "Other Skills";
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  // Order: follow SKILL_PRESETS order, then any custom categories alphabetically.
  const presetOrder = SKILL_PRESETS.map((g) => g.category);
  const orderedKeys = Object.keys(groups).sort((a, b) => {
    const ai = presetOrder.indexOf(a);
    const bi = presetOrder.indexOf(b);
    if (ai !== -1 && bi !== -1) return ai - bi;
    if (ai !== -1) return -1;
    if (bi !== -1) return 1;
    return a.localeCompare(b);
  });

  return (
    <section id="expertise" className="border-t bg-secondary/40 relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-dot-grid opacity-50" />
      <div className="container py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Expertise that drives success
          </p>
          {isOwner && (
            <div className="mt-3 flex justify-center">
              <SectionEditButton onClick={onEdit} label="Edit skills" />
            </div>
          )}
        </div>

        {orderedKeys.length === 0 ? (
          <div className="max-w-md mx-auto text-center text-sm text-muted-foreground border border-dashed rounded-lg p-8 bg-card">
            {isOwner ? (
              <>
                <p>No expertise selected yet.</p>
                <button
                  type="button"
                  onClick={onEdit}
                  className="mt-3 text-primary hover:underline text-sm font-medium"
                >
                  Pick your skills
                </button>
              </>
            ) : (
              "No skills listed yet"
            )}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-lg overflow-hidden border max-w-6xl mx-auto">
            {orderedKeys.map((cat) => {
              const Icon = iconForCategory(cat);
              const desc = presetDescription.get(cat);
              return (
                <Card
                  key={cat}
                  className="rounded-none border-0 p-7 text-center bg-card shadow-none hover:bg-secondary/60 transition-colors"
                >
                  <div className="mx-auto h-12 w-12 rounded-lg bg-foreground text-background flex items-center justify-center">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mt-5">{cat}</h3>
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {desc ||
                      groups[cat]
                        .slice(0, 5)
                        .map((s) => s.name)
                        .join(", ")}
                  </p>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default ExpertiseSection;
