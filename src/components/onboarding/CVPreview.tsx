import { Mail, MapPin, Linkedin, Github, Globe, Twitter } from 'lucide-react';
import { OnboardingData } from '@/types/onboarding';
import { Button } from '@/components/ui/button';
import { useRef } from 'react';
import { toast } from 'sonner';

interface CVPreviewProps {
  data: OnboardingData;
}

export const CVPreview = ({ data }: CVPreviewProps) => {
  const cvRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!cvRef.current) return;

    try {
      // Dynamic import to avoid issues if libraries aren't installed
      const { jsPDF } = await import('jspdf');
      const html2canvas = await import('html2canvas').then(m => m.default);

      const canvas = await html2canvas(cvRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      const imgData = canvas.toDataURL('image/png');

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= 297; // A4 height

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= 297;
      }

      pdf.save(`${data.profile.full_name || 'CV'}.pdf`);
      toast.success('CV downloaded successfully!');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to download CV. Make sure jsPDF and html2canvas are installed.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-50">LIVE PREVIEW CV</h3>
        <Button
          onClick={downloadPDF}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Download PDF ↓
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
        <div
          ref={cvRef}
          className="w-full bg-white dark:bg-gray-900 aspect-[8.5/11] p-8 shadow-sm rounded-sm"
          style={{ maxWidth: '100%' }}
        >
          {/* Header */}
          <div className="mb-4">
            <div className="flex items-start gap-4 mb-3">
              {data.profile.avatar_url && (
                <img
                  src={data.profile.avatar_url}
                  alt={data.profile.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  {data.profile.full_name || 'Your Name'}
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {data.profile.profession}
                </p>
              </div>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-2">
              {data.profile.location && (
                <div className="flex items-center gap-1">
                  <MapPin size={14} />
                  <span>{data.profile.location}</span>
                </div>
              )}
              {data.profile.email && (
                <div className="flex items-center gap-1">
                  <Mail size={14} />
                  <span>{data.profile.email}</span>
                </div>
              )}
              {data.profile.linkedin_url && (
                <div className="flex items-center gap-1">
                  <Linkedin size={14} />
                  <a href={data.profile.linkedin_url} className="hover:underline">LinkedIn</a>
                </div>
              )}
              {data.profile.github_url && (
                <div className="flex items-center gap-1">
                  <Github size={14} />
                  <a href={data.profile.github_url} className="hover:underline">GitHub</a>
                </div>
              )}
              {data.profile.website_url && (
                <div className="flex items-center gap-1">
                  <Globe size={14} />
                  <a href={data.profile.website_url} className="hover:underline">Website</a>
                </div>
              )}
              {data.profile.twitter_url && (
                <div className="flex items-center gap-1">
                  <Twitter size={14} />
                  <a href={data.profile.twitter_url} className="hover:underline">X</a>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700" />

          {/* About */}
          {data.profile.bio && (
            <div className="mb-4">
              <h2 className="text-xs font-bold text-gray-900 dark:text-gray-50 mb-1 uppercase tracking-wide">
                About
              </h2>
              <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                {data.profile.bio}
              </p>
            </div>
          )}

          {/* Education */}
          {data.education.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold text-gray-900 dark:text-gray-50 mb-2 uppercase tracking-wide">
                Education
              </h2>
              <div className="space-y-2">
                {data.education.map((edu) => (
                  <div key={edu.id} className="flex gap-2">
                    {edu.logo_url && (
                      <img
                        src={edu.logo_url}
                        alt={edu.institution_name}
                        className="w-6 h-6 object-contain flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-gray-900 dark:text-gray-50">
                        {edu.degree} in {edu.field_of_study}
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {edu.institution_name}
                      </div>
                      <div className="text-gray-500 dark:text-gray-500">
                        {edu.start_year} – {edu.end_year}
                        {edu.gpa && ` • GPA: ${edu.gpa.toFixed(2)}`}
                      </div>
                      {edu.description && (
                        <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                          {edu.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Experience */}
          {data.experience.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold text-gray-900 dark:text-gray-50 mb-2 uppercase tracking-wide">
                Experience
              </h2>
              <div className="space-y-2">
                {data.experience.map((exp) => (
                  <div key={exp.id} className="flex gap-2">
                    {exp.logo_url && (
                      <img
                        src={exp.logo_url}
                        alt={exp.company_name}
                        className="w-6 h-6 object-contain flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 text-xs">
                      <div className="font-semibold text-gray-900 dark:text-gray-50 flex items-center gap-2">
                        {exp.job_title}
                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 rounded text-gray-700 dark:text-gray-300">
                          {exp.employment_type}
                        </span>
                      </div>
                      <div className="text-gray-600 dark:text-gray-400">
                        {exp.company_name} • {exp.location}
                      </div>
                      <div className="text-gray-500 dark:text-gray-500">
                        {formatDate(exp.start_date)} – {exp.is_current ? 'Present' : formatDate(exp.end_date || '')}
                      </div>
                      {exp.description && (
                        <p className="text-gray-600 dark:text-gray-400 mt-0.5">
                          {exp.description}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio */}
          {data.portfolio.length > 0 && (
            <div className="mb-4">
              <h2 className="text-xs font-bold text-gray-900 dark:text-gray-50 mb-2 uppercase tracking-wide">
                Portfolio
              </h2>
              <div className="space-y-2">
                {data.portfolio.map((project) => (
                  <div key={project.id} className="text-xs">
                    <div className="font-semibold text-gray-900 dark:text-gray-50">
                      {project.title} • {project.year}
                    </div>
                    {project.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-xs">
                        {project.description}
                      </p>
                    )}
                    {project.tech_stack.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {project.tech_stack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
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

          {/* Skills */}
          {data.skills.length > 0 && (
            <div>
              <h2 className="text-xs font-bold text-gray-900 dark:text-gray-50 mb-2 uppercase tracking-wide">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {data.skills.map((skill) => (
                  <span
                    key={skill.id}
                    className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded"
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