import { Mail, MapPin, Linkedin, Github, Globe, Twitter } from 'lucide-react';
import { OnboardingData } from '@/types/onboarding';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import { toast } from 'sonner';
import { CVFormatOptions, DEFAULT_FORMAT, FONT_SIZE_MAP } from './CVFormatToolbar';

interface CVPreviewProps {
  data: OnboardingData;
  format?: CVFormatOptions;
}

export const CVPreview = ({ data, format = DEFAULT_FORMAT }: CVPreviewProps) => {
  const cvRef = useRef<HTMLDivElement>(null);

  const sizes = FONT_SIZE_MAP[format.fontSizePreset];

  // CSS vars applied to the CV root
  const cvStyle: React.CSSProperties = {
    fontFamily: format.fontFamily,
    fontSize: `${sizes.base}pt`,
    lineHeight: `${format.lineSpacing}pt`,
    textAlign: format.alignment,
    maxWidth: '100%',
  };

  // ── Section heading renderer based on headerStyle ───────────────────────────
  const SectionHeading = ({ children }: { children: React.ReactNode }) => {
    const color = format.headerColor;

    switch (format.headerStyle) {
      case 'modern':
        return (
          <div
            className="mb-2 px-2 py-0.5 rounded-sm"
            style={{ backgroundColor: color }}
          >
            <h2
              className="font-bold uppercase tracking-wider text-white"
              style={{ fontSize: `${sizes.section}pt` }}
            >
              {children}
            </h2>
          </div>
        );

      case 'minimal':
        return (
          <h2
            className="font-semibold uppercase tracking-widest mb-1"
            style={{ fontSize: `${sizes.section}pt`, color, letterSpacing: '0.12em' }}
          >
            {children}
          </h2>
        );

      case 'bold':
        return (
          <div className="mb-2 flex items-center gap-2">
            <span
              className="w-1 self-stretch rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <h2
              className="font-extrabold uppercase tracking-wide"
              style={{ fontSize: `${sizes.section + 1}pt`, color }}
            >
              {children}
            </h2>
          </div>
        );

      case 'classic':
      default:
        return (
          <div className="mb-2">
            <h2
              className="font-bold uppercase tracking-wide"
              style={{ fontSize: `${sizes.section}pt`, color }}
            >
              {children}
            </h2>
            <div className="h-px mt-0.5" style={{ backgroundColor: color, opacity: 0.3 }} />
          </div>
        );
    }
  };

  const downloadPDF = async () => {
    if (!cvRef.current) return;
    try {
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas').then((m) => m.default);

      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const imgWidth = 210;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`${data.profile.full_name || 'CV'}.pdf`);
      toast.success('CV berhasil diunduh!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Gagal mengunduh CV. Pastikan jsPDF dan html2canvas sudah terpasang.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">LIVE PREVIEW CV</h3>
        <Button onClick={downloadPDF} variant="outline" size="sm" className="text-xs">
          Download PDF ↓
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div
          ref={cvRef}
          className="w-full bg-white dark:bg-gray-900 aspect-[8.5/11] p-8 shadow-sm rounded-sm"
          style={cvStyle}
        >
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="mb-4">
            <div className="flex items-start gap-4 mb-3">
              {data.profile.avatar_url && (
                <img
                  src={data.profile.avatar_url}
                  alt={data.profile.full_name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
              )}
              <div className="flex-1">
                <h1
                  className="font-bold text-gray-900 dark:text-gray-50"
                  style={{ fontSize: `${sizes.name}pt` }}
                >
                  {data.profile.full_name || 'Your Name'}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-0.5" style={{ fontSize: `${sizes.base + 1}pt` }}>
                  {data.profile.profession}
                </p>
              </div>
            </div>

            {/* Contact strip */}
            <div
              className="flex flex-wrap items-center gap-3 text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2"
              style={{ fontSize: `${sizes.base}pt` }}
            >
              {data.profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={10} />
                  <span>{data.profile.location}</span>
                </div>
              )}
              {data.profile.email && (
                <div className="flex items-center gap-1">
                  <Mail size={10} />
                  <span>{data.profile.email}</span>
                </div>
              )}
              {data.profile.linkedin_url && (
                <div className="flex items-center gap-1">
                  <Linkedin size={10} />
                  <a href={data.profile.linkedin_url} className="hover:underline">LinkedIn</a>
                </div>
              )}
              {data.profile.github_url && (
                <div className="flex items-center gap-1">
                  <Github size={10} />
                  <a href={data.profile.github_url} className="hover:underline">GitHub</a>
                </div>
              )}
              {data.profile.website_url && (
                <div className="flex items-center gap-1">
                  <Globe size={10} />
                  <a href={data.profile.website_url} className="hover:underline">Website</a>
                </div>
              )}
              {data.profile.twitter_url && (
                <div className="flex items-center gap-1">
                  <Twitter size={10} />
                  <a href={data.profile.twitter_url} className="hover:underline">X</a>
                </div>
              )}
            </div>
          </div>

          {/* ── About ──────────────────────────────────────────────────────── */}
          {data.profile.bio && (
            <div className="mb-4">
              <SectionHeading>About</SectionHeading>
              <p className="text-gray-700 dark:text-gray-300" style={{ lineHeight: `${format.lineSpacing}pt` }}>
                {data.profile.bio}
              </p>
            </div>
          )}

          {/* ── Education ──────────────────────────────────────────────────── */}
          {data.education.length > 0 && (
            <div className="mb-4">
              <SectionHeading>Education</SectionHeading>
              <div className="space-y-2">
                {data.education.map((edu) => (
                  <div key={edu.id} className="flex gap-2">
                    {edu.logo_url && (
                      <img src={edu.logo_url} alt={edu.institution_name} className="w-5 h-5 object-contain flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-50">
                        {edu.degree} in {edu.field_of_study}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">{edu.institution_name}</div>
                      <div className="text-gray-500">
                        {edu.start_year} – {edu.end_year}
                        {edu.gpa && ` • GPA: ${edu.gpa.toFixed(2)}`}
                      </div>
                      {edu.description && <p className="text-gray-600 dark:text-gray-400 mt-0.5">{edu.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Experience ─────────────────────────────────────────────────── */}
          {data.experience.length > 0 && (
            <div className="mb-4">
              <SectionHeading>Experience</SectionHeading>
              <div className="space-y-2">
                {data.experience.map((exp) => (
                  <div key={exp.id} className="flex gap-2">
                    {exp.logo_url && (
                      <img src={exp.logo_url} alt={exp.company_name} className="w-5 h-5 object-contain flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2 flex-wrap">
                        {exp.job_title}
                        <span
                          className="px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300"
                          style={{ fontSize: `${sizes.base - 1}pt`, backgroundColor: '#F3F4F6' }}
                        >
                          {exp.employment_type}
                        </span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {exp.company_name} • {exp.location}
                      </div>
                      <div className="text-gray-500">
                        {formatDate(exp.start_date)} – {exp.is_current ? 'Present' : formatDate(exp.end_date || '')}
                      </div>
                      {exp.description && <p className="text-gray-600 dark:text-gray-400 mt-0.5">{exp.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Portfolio ──────────────────────────────────────────────────── */}
          {data.portfolio.length > 0 && (
            <div className="mb-4">
              <SectionHeading>Portfolio</SectionHeading>
              <div className="space-y-2">
                {data.portfolio.map((project) => (
                  <div key={project.id}>
                    <div className="font-semibold text-gray-900 dark:text-gray-50">
                      {project.title} • {project.year}
                    </div>
                    {project.description && (
                      <p className="text-gray-600 dark:text-gray-400">{project.description}</p>
                    )}
                    {project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.tech_stack.map((tech) => (
                          <span
                            key={tech}
                            className="px-1.5 py-0.5 rounded text-gray-700 dark:text-gray-300"
                            style={{ fontSize: `${sizes.base - 1}pt`, backgroundColor: '#F3F4F6' }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Skills ─────────────────────────────────────────────────────── */}
          {data.skills.length > 0 && (
            <div>
              <SectionHeading>Skills</SectionHeading>
              <div className="flex flex-wrap gap-1.5">
                {data.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-0.5 rounded text-gray-700 dark:text-gray-300"
                    style={{ fontSize: `${sizes.base}pt`, backgroundColor: '#F3F4F6' }}
                  >
                    {skill.name} • {skill.level}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month] = dateStr.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}