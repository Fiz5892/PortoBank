import { GraduationCap } from "lucide-react";
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

const monthYear = (year: number | null, monthIndex = 0) => {
  if (!year) return "";
  return new Date(year, monthIndex, 1).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });
};

const EducationSection = ({ educations, isOwner, onEdit }: Props) => {
  const sorted = [...educations].sort((a, b) => (b.end_year ?? 9999) - (a.end_year ?? 9999));

  return (
    <section id="education" className="container py-16 md:py-24 border-t">
      <div className="grid gap-10 md:grid-cols-12">
        {/* LEFT — title + intro */}
        <div className="md:col-span-4">
          <div className="md:sticky md:top-24">
            <div className="flex items-start gap-2">
              <h2 className="font-heading text-4xl md:text-5xl font-extrabold leading-[1.05] text-gradient-brand">
                Education
              </h2>
              {isOwner && <SectionEditButton onClick={onEdit} label="Edit education" />}
            </div>
            <p className="text-muted-foreground mt-4 max-w-xs">
              My academic background and qualifications.
            </p>
          </div>
        </div>

        {/* RIGHT — list */}
        <div className="md:col-span-8">
          {sorted.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-8 text-center">
              No education listed yet
              {isOwner && (
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    Add your education
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y border-y">
              {sorted.map((ed) => {
                const start = monthYear(ed.start_year, 7); // Aug
                const end = monthYear(ed.end_year, 0); // Jan
                const range =
                  start || end ? `${start || "?"} - ${end || "Present"}` : "";
                const subtitle = [
                  [ed.degree, ed.field_of_study].filter(Boolean).join(" "),
                  ed.gpa ? `GPA: ${ed.gpa}` : "",
                ]
                  .filter(Boolean)
                  .join(" - ");

                return (
                  <li key={ed.id} className="py-5 flex items-center gap-4">
                    <div className="shrink-0 h-12 w-12 rounded-full bg-secondary border flex items-center justify-center overflow-hidden">
                      {ed.institution_logo_url ? (
                        <img
                          src={ed.institution_logo_url}
                          alt={ed.institution_name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <GraduationCap className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{ed.institution_name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground whitespace-nowrap shrink-0">
                      {range}
                    </p>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
};

export default EducationSection;
