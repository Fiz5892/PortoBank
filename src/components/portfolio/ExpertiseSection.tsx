import { Card } from "@/components/ui/card";
import SectionEditButton from "./SectionEditButton";
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
  if (/(desktop|windows|mac|linux)/.test(c)) return Monitor;
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

const ExpertiseSection = ({ skills, isOwner, onEdit }: Props) => {
  // Group by category — only show categories that have at least 1 skill
  const groups = skills.reduce<Record<string, SkillRow[]>>((acc, s) => {
    const key = s.category?.trim() || "Other Skills";
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  const orderedKeys = Object.keys(groups).sort((a, b) => {
    if (a === "Other Skills") return 1;
    if (b === "Other Skills") return -1;
    return a.localeCompare(b);
  });

  return (
    <section id="expertise" className="border-t bg-secondary/40">
      <div className="container py-16 md:py-24">
        <div className="text-center mb-10">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Expertise that drives success
          </p>
          {isOwner && (
            <div className="mt-2 flex justify-center">
              <SectionEditButton onClick={onEdit} label="Edit skills" />
            </div>
          )}
        </div>

        {orderedKeys.length === 0 ? (
          <div className="max-w-md mx-auto text-center text-sm text-muted-foreground border border-dashed rounded-lg p-8 bg-card">
            No skills listed yet
          </div>
        ) : (
          <div className="grid gap-px bg-border rounded-lg overflow-hidden border">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border">
              {orderedKeys.map((cat) => {
                const Icon = iconForCategory(cat);
                const items = groups[cat];
                const preview = items.slice(0, 5).map((s) => s.name).join(", ");
                return (
                  <Card
                    key={cat}
                    className="rounded-none border-0 p-7 text-center bg-card shadow-none hover:bg-secondary/60 transition-colors"
                  >
                    <div className="mx-auto h-12 w-12 rounded-lg bg-foreground text-background flex items-center justify-center">
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg mt-5">{cat}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed line-clamp-3">
                      {preview}
                      {items.length > 5 ? ` +${items.length - 5} more` : ""}
                    </p>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ExpertiseSection;
