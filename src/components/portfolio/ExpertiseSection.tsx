import { useMemo } from "react";
import SectionEditButton from "./SectionEditButton";
import { SKILL_PRESETS } from "@/lib/skill-presets";
import { Sparkles } from "lucide-react";

export interface SkillRow {
  name: string;
  category: string | null;
}

interface Props {
  skills: SkillRow[];
  isOwner: boolean;
  onEdit: () => void;
}

const ExpertiseSection = ({ skills, isOwner, onEdit }: Props) => {
  // Group selected skills by category, then enrich with preset metadata (icon + description).
  const cards = useMemo(() => {
    const groups = skills.reduce<Record<string, SkillRow[]>>((acc, s) => {
      const key = s.category?.trim() || "Other Skills";
      (acc[key] = acc[key] || []).push(s);
      return acc;
    }, {});

    const presetByName = new Map(SKILL_PRESETS.map((p) => [p.category, p]));
    const presetOrder = SKILL_PRESETS.map((g) => g.category);

    return Object.keys(groups)
      .sort((a, b) => {
        const ai = presetOrder.indexOf(a);
        const bi = presetOrder.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
      })
      .map((cat) => {
        const preset = presetByName.get(cat);
        return {
          category: cat,
          icon: preset?.icon ?? Sparkles,
          description:
            preset?.description ??
            "A set of skills I bring to the table to help projects move forward.",
          skills: groups[cat],
        };
      });
  }, [skills]);

  return (
    <section id="expertise" className="border-t bg-secondary/40 relative overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-dot-grid opacity-50" />
      <div className="container py-16 md:py-24">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Expertise that drives success
          </p>
          {isOwner && (
            <div className="mt-4 flex justify-center">
              <SectionEditButton onClick={onEdit} label="Edit skills" />
            </div>
          )}
        </div>

        {cards.length === 0 ? (
          <div className="max-w-md mx-auto text-center text-sm text-muted-foreground border border-dashed rounded-lg p-8 bg-card">
            {isOwner ? (
              <>
                <p>No expertise added yet.</p>
                <button
                  type="button"
                  onClick={onEdit}
                  className="mt-3 text-primary hover:underline text-sm font-medium"
                >
                  Pick your skills
                </button>
              </>
            ) : (
              "No expertise listed yet"
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 border-l border-t border-border/60 bg-card/40">
            {cards.map(({ category, icon: Icon, description, skills: catSkills }) => (
              <div
                key={category}
                className="group p-8 border-r border-b border-border/60 text-center flex flex-col items-center transition-colors hover:bg-background"
              >
                <div className="h-12 w-12 rounded-xl bg-foreground text-background flex items-center justify-center shadow-subtle">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading text-lg font-semibold mt-5">{category}</h3>
                <p className="text-sm text-muted-foreground mt-3 leading-relaxed max-w-xs">
                  {description}
                </p>
                <div className="flex flex-wrap justify-center gap-1.5 mt-5">
                  {catSkills.map((s) => (
                    <span
                      key={`${category}-${s.name}`}
                      className="inline-flex items-center rounded-full border bg-background/70 px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {s.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default ExpertiseSection;
