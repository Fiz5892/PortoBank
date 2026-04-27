import { Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionEditButton from "./SectionEditButton";

export interface ExperienceRow {
  id: string;
  job_title: string;
  company_name: string;
  employment_type: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  location: string | null;
  description: string | null;
  company_logo_url: string | null;
}

interface Props {
  experiences: ExperienceRow[];
  isOwner: boolean;
  onEdit: () => void;
}

const formatMonthYear = (s: string | null) => {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
};

const ExperienceSection = ({ experiences, isOwner, onEdit }: Props) => {
  const sorted = [...experiences].sort((a, b) => {
    const aD = a.is_current ? Date.now() : a.end_date ? new Date(a.end_date).getTime() : 0;
    const bD = b.is_current ? Date.now() : b.end_date ? new Date(b.end_date).getTime() : 0;
    return bD - aD;
  });

  return (
    <section id="experience" className="container py-16 md:py-24">
      <div className="grid gap-10 md:grid-cols-12">
        {/* LEFT — title + intro */}
        <div className="md:col-span-4">
          <div className="md:sticky md:top-24">
            <div className="flex items-start gap-2">
              <h2 className="font-heading text-4xl md:text-5xl font-extrabold leading-[1.05] text-gradient-brand">
                Work
                <br />
                Experiences
              </h2>
              {isOwner && <SectionEditButton onClick={onEdit} label="Edit experience" />}
            </div>
            <p className="text-muted-foreground mt-4 max-w-xs">
              I've worked with a variety of companies across different industries. Here are some of
              my most recent experiences.
            </p>
          </div>
        </div>

        {/* RIGHT — list */}
        <div className="md:col-span-8">
          {sorted.length === 0 ? (
            <div className="text-sm text-muted-foreground border border-dashed rounded-lg p-8 text-center">
              No experience listed yet
              {isOwner && (
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={onEdit}>
                    Add your first experience
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <ul className="divide-y border-y">
              {sorted.map((exp) => {
                const range = `${formatMonthYear(exp.start_date)} - ${
                  exp.is_current ? "Present" : formatMonthYear(exp.end_date)
                }`;
                return (
                  <li key={exp.id} className="py-5 flex items-center gap-4">
                    <div className="shrink-0 h-12 w-12 rounded-full bg-secondary border flex items-center justify-center overflow-hidden">
                      {exp.company_logo_url ? (
                        <img
                          src={exp.company_logo_url}
                          alt={exp.company_name}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <Briefcase className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold truncate">{exp.company_name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{exp.job_title}</p>
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

export default ExperienceSection;
