import SectionEditButton from "./SectionEditButton";
import { SKILL_PRESETS } from "@/lib/skill-presets";

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
  // Group by category — the heading is just context; skills are the focus.
  const groups = skills.reduce<Record<string, SkillRow[]>>((acc, s) => {
    const key = s.category?.trim() || "Other Skills";
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

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
            Expertise
          </p>
          <h2 className="font-heading text-3xl md:text-4xl font-bold mt-3">
            Skills & strengths
          </h2>
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
                <p>No skills added yet.</p>
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
          <div className="max-w-5xl mx-auto space-y-10">
            {orderedKeys.map((cat) => (
              <div key={cat}>
                <h3 className="font-heading font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-4">
                  {cat}
                </h3>
                <div className="flex flex-wrap gap-2.5">
                  {groups[cat].map((s) => (
                    <span
                      key={`${cat}-${s.name}`}
                      className="inline-flex items-center rounded-full border bg-card px-4 py-2 text-sm font-medium shadow-subtle hover:border-primary hover:text-primary transition-colors"
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
