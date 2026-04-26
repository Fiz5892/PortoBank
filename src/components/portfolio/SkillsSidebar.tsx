import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import SectionEditButton from "./SectionEditButton";

export interface SkillRow {
  name: string;
  category: string | null;
}

interface Props {
  skills: SkillRow[];
  isOwner: boolean;
  onEdit: () => void;
}

const SkillsSidebar = ({ skills, isOwner, onEdit }: Props) => {
  // Group by category
  const groups = skills.reduce<Record<string, SkillRow[]>>((acc, s) => {
    const key = s.category?.trim() || "Other";
    (acc[key] = acc[key] || []).push(s);
    return acc;
  }, {});

  const orderedKeys = Object.keys(groups).sort((a, b) => {
    if (a === "Other") return 1;
    if (b === "Other") return -1;
    return a.localeCompare(b);
  });

  const hasCategories = skills.some((s) => s.category);

  return (
    <Card className="p-5 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold">Skills</h2>
        {isOwner && <SectionEditButton onClick={onEdit} label="Edit skills" />}
      </div>

      {skills.length === 0 ? (
        <p className="text-sm text-muted-foreground">No skills listed yet</p>
      ) : hasCategories ? (
        <div className="space-y-4">
          {orderedKeys.map((cat) => (
            <div key={cat}>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
                {cat}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {groups[cat].map((s) => (
                  <Badge key={s.name} variant="secondary" className="font-normal">
                    {s.name}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {skills.map((s) => (
            <Badge key={s.name} variant="secondary" className="font-normal">
              {s.name}
            </Badge>
          ))}
        </div>
      )}
    </Card>
  );
};

export default SkillsSidebar;
