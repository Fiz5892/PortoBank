import { useMemo } from "react";
import SectionEditButton from "./SectionEditButton";
import { SKILL_PRESETS } from "@/lib/skill-presets";
import { Badge } from "@/components/ui/badge";
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
  // Group selected skills by category, then enrich with preset metadata (icon).
  const groups = useMemo(() => {
    const map = skills.reduce<Record<string, SkillRow[]>>((acc, s) => {
      const key = s.category?.trim() || "Other Skills";
      (acc[key] = acc[key] || []).push(s);
      return acc;
    }, {});

    const presetByName = new Map(SKILL_PRESETS.map((p) => [p.category, p]));
    const presetOrder = SKILL_PRESETS.map((g) => g.category);

    return Object.keys(map)
      .sort((a, b) => {
        const ai = presetOrder.indexOf(a);
        const bi = presetOrder.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
      })
      .map((cat) => ({
        category: cat,
        icon: presetByName.get(cat)?.icon ?? Sparkles,
        skills: map[cat],
      }));
  }, [skills]);

  return (
    <section id="expertise" className="border-t bg-secondary/40">
      <div className="container py-16 md:py-24">
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Expertise
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mt-3">
            Skills & areas I specialize in
          </h2>
          {isOwner && (
            <div className="mt-4 flex justify-center">
              <SectionEditButton onClick={onEdit} label="Edit skills" />
            </div>
          )}
        </div>

        {groups.length === 0 ? (
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
          <div className="max-w-4xl mx-auto space-y-6">
            {groups.map(({ category, icon: Icon, skills: catSkills }) => (
              <div
                key={category}
                className="rounded-xl border border-border bg-card p-5 md:p-6 shadow-subtle"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="font-heading font-semibold text-base md:text-lg">
                    {category}
                  </h3>
                  <span className="ml-auto text-xs text-muted-foreground">
                    {catSkills.length} {catSkills.length === 1 ? "skill" : "skills"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {catSkills.map((s) => (
                    <Badge
                      key={`${category}-${s.name}`}
                      variant="secondary"
                      className="rounded-full px-3 py-1 text-xs font-medium"
                    >
                      {s.name}
                    </Badge>
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
