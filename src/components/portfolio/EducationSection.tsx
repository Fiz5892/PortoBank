import { useState } from "react";
import { GraduationCap, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import SectionEditButton from "./SectionEditButton";

export interface EducationRow {
  id: string;
  degree: string;
  field_of_study: string | null;
  institution_name: string;
  start_year: number | null;
  end_year: number | null;
  gpa: string | null;
  description: string | null;
  institution_logo_url: string | null;
}

interface Props {
  educations: EducationRow[];
  isOwner: boolean;
  onEdit: () => void;
}

const EducationItem = ({ ed }: { ed: EducationRow }) => {
  const [open, setOpen] = useState(false);
  const longDesc = (ed.description?.length ?? 0) > 220;
  const range = ed.start_year || ed.end_year ? `${ed.start_year ?? "?"} – ${ed.end_year ?? "Present"}` : "";

  return (
    <div className="flex gap-4">
      <div className="shrink-0 h-12 w-12 rounded-md bg-secondary flex items-center justify-center overflow-hidden border">
        {ed.institution_logo_url ? (
          <img src={ed.institution_logo_url} alt={ed.institution_name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <GraduationCap className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold leading-tight">
          {ed.degree}
          {ed.field_of_study && <span className="font-normal"> · {ed.field_of_study}</span>}
        </h3>
        <p className="text-sm text-foreground/80 mt-0.5">{ed.institution_name}</p>
        {range && <p className="text-xs text-muted-foreground mt-1">{range}</p>}
        {ed.gpa && <p className="text-xs text-muted-foreground mt-0.5">GPA: {ed.gpa}</p>}
        {ed.description && (
          <div className="mt-2">
            <p
              className={`text-sm text-foreground/80 whitespace-pre-wrap ${
                !open && longDesc ? "line-clamp-3" : ""
              }`}
            >
              {ed.description}
            </p>
            {longDesc && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-1 text-xs"
                onClick={() => setOpen((o) => !o)}
              >
                {open ? "Show less" : "Show more"}
                <ChevronDown className={`ml-1 h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const EducationSection = ({ educations, isOwner, onEdit }: Props) => {
  const sorted = [...educations].sort((a, b) => (b.end_year ?? 9999) - (a.end_year ?? 9999));

  return (
    <Card className="p-6 shadow-subtle" id="education">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading font-semibold text-lg">Education</h2>
        {isOwner && <SectionEditButton onClick={onEdit} label="Edit education" />}
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No education listed yet</p>
      ) : (
        <div className="space-y-6">
          {sorted.map((ed) => (
            <EducationItem key={ed.id} ed={ed} />
          ))}
        </div>
      )}
    </Card>
  );
};

export default EducationSection;
