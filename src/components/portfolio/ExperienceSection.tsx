import { useState } from "react";
import { Briefcase, MapPin, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const formatDuration = (start: string | null, end: string | null, current: boolean) => {
  if (!start) return "";
  const startD = new Date(start);
  const endD = current || !end ? new Date() : new Date(end);
  if (isNaN(startD.getTime()) || isNaN(endD.getTime())) return "";
  const months =
    (endD.getFullYear() - startD.getFullYear()) * 12 + (endD.getMonth() - startD.getMonth());
  if (months < 1) return "";
  const years = Math.floor(months / 12);
  const m = months % 12;
  if (years === 0) return `${m} mo`;
  if (m === 0) return `${years} yr${years > 1 ? "s" : ""}`;
  return `${years} yr${years > 1 ? "s" : ""} ${m} mo`;
};

const ExperienceItem = ({ exp }: { exp: ExperienceRow }) => {
  const [open, setOpen] = useState(false);
  const range = `${formatMonthYear(exp.start_date)} – ${
    exp.is_current ? "Present" : formatMonthYear(exp.end_date)
  }`;
  const dur = formatDuration(exp.start_date, exp.end_date, exp.is_current);
  const longDesc = (exp.description?.length ?? 0) > 220;

  return (
    <div className="flex gap-4">
      <div className="shrink-0 h-12 w-12 rounded-md bg-secondary flex items-center justify-center overflow-hidden border">
        {exp.company_logo_url ? (
          <img src={exp.company_logo_url} alt={exp.company_name} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <Briefcase className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold leading-tight">{exp.job_title}</h3>
        <p className="text-sm text-foreground/80 mt-0.5">
          {exp.company_name}
          {exp.employment_type && (
            <Badge variant="secondary" className="ml-2 text-[10px] font-normal py-0">
              {exp.employment_type}
            </Badge>
          )}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {range}
          {dur && <> · {dur}</>}
        </p>
        {exp.location && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="h-3 w-3" /> {exp.location}
          </p>
        )}
        {exp.description && (
          <div className="mt-2">
            <p
              className={`text-sm text-foreground/80 whitespace-pre-wrap ${
                !open && longDesc ? "line-clamp-3" : ""
              }`}
            >
              {exp.description}
            </p>
            {longDesc && (
              <Button
                variant="link"
                size="sm"
                className="h-auto p-0 mt-1 text-xs"
                onClick={() => setOpen((o) => !o)}
              >
                {open ? "Show less" : "Show more"}
                <ChevronDown
                  className={`ml-1 h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`}
                />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const ExperienceSection = ({ experiences, isOwner, onEdit }: Props) => {
  const sorted = [...experiences].sort((a, b) => {
    const aD = a.is_current ? Date.now() : a.end_date ? new Date(a.end_date).getTime() : 0;
    const bD = b.is_current ? Date.now() : b.end_date ? new Date(b.end_date).getTime() : 0;
    return bD - aD;
  });

  return (
    <Card className="p-6 shadow-subtle" id="experience">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading font-semibold text-lg">Experience</h2>
        {isOwner && <SectionEditButton onClick={onEdit} label="Edit experience" />}
      </div>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No experience listed yet</p>
      ) : (
        <div className="space-y-6">
          {sorted.map((exp) => (
            <ExperienceItem key={exp.id} exp={exp} />
          ))}
        </div>
      )}
    </Card>
  );
};

export default ExperienceSection;
