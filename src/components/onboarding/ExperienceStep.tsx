import { ExperienceEntry } from '@/types/onboarding';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Upload } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const EMPLOYMENT_TYPES = [
  'Full-time',
  'Part-time',
  'Freelance',
  'Internship',
  'Contract',
  'Volunteer',
] as const;

interface ExperienceStepProps {
  data: ExperienceEntry[];
  onChange: (data: ExperienceEntry[]) => void;
  isLoading?: boolean;
}

export const ExperienceStep = ({
  data,
  onChange,
  isLoading,
}: ExperienceStepProps) => {
  const addExperience = () => {
    const now = new Date();
    const currentDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    onChange([
      ...data,
      {
        id: generateId(),
        job_title: '',
        company_name: '',
        employment_type: 'Full-time',
        location: '',
        start_date: currentDate,
        end_date: currentDate,
        is_current: false,
        description: '',
        logo_url: undefined,
      },
    ]);
  };

  const removeExperience = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  const updateExperience = (
    id: string,
    updates: Partial<ExperienceEntry>
  ) => {
    onChange(
      data.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const handleLogoChange = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateExperience(id, { logo_url: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Add your work experience
          </p>
        ) : (
          data.map((exp) => (
            <Card key={exp.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Logo Upload */}
                  <div className="flex items-center gap-3 mb-3">
                    {exp.logo_url ? (
                      <img
                        src={exp.logo_url}
                        alt="Logo"
                        className="w-10 h-10 object-cover rounded"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center">
                        <span className="text-xs text-gray-400">Logo</span>
                      </div>
                    )}
                    <label className="cursor-pointer">
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                      >
                        <span className="text-xs flex items-center gap-1">
                          <Upload size={12} />
                          Logo
                        </span>
                      </Button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleLogoChange(exp.id, e)}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                  </div>

                  {/* Job Title */}
                  <div className="space-y-1.5 mb-3">
                    <Label className="text-xs">Job Title *</Label>
                    <Input
                      placeholder="Frontend Developer"
                      value={exp.job_title}
                      onChange={(e) =>
                        updateExperience(exp.id, {
                          job_title: e.target.value,
                        })
                      }
                      disabled={isLoading}
                      className="text-sm"
                    />
                  </div>

                  {/* Company */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Company Name *</Label>
                      <Input
                        placeholder="Google"
                        value={exp.company_name}
                        onChange={(e) =>
                          updateExperience(exp.id, {
                            company_name: e.target.value,
                          })
                        }
                        disabled={isLoading}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Employment Type *</Label>
                      <Select
                        value={exp.employment_type}
                        onValueChange={(value) =>
                          updateExperience(exp.id, {
                            employment_type: value as ExperienceEntry['employment_type'],
                          })
                        }
                        disabled={isLoading}
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {EMPLOYMENT_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="space-y-1.5 mb-3">
                    <Label className="text-xs">Location</Label>
                    <Input
                      placeholder="Jakarta, Indonesia or Remote"
                      value={exp.location}
                      onChange={(e) =>
                        updateExperience(exp.id, { location: e.target.value })
                      }
                      disabled={isLoading}
                      className="text-sm"
                    />
                  </div>

                  {/* Dates */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Start Date *</Label>
                      <Input
                        type="month"
                        value={exp.start_date}
                        onChange={(e) =>
                          updateExperience(exp.id, {
                            start_date: e.target.value,
                          })
                        }
                        disabled={isLoading}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">End Date</Label>
                      <Input
                        type="month"
                        value={exp.end_date || ''}
                        onChange={(e) =>
                          updateExperience(exp.id, {
                            end_date: e.target.value,
                          })
                        }
                        disabled={isLoading || exp.is_current}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Currently Working */}
                  <div className="flex items-center gap-2 mb-3">
                    <Checkbox
                      id={`current-${exp.id}`}
                      checked={exp.is_current}
                      onCheckedChange={(checked) =>
                        updateExperience(exp.id, {
                          is_current: checked as boolean,
                          end_date: checked ? null : exp.end_date,
                        })
                      }
                      disabled={isLoading}
                    />
                    <label
                      htmlFor={`current-${exp.id}`}
                      className="text-xs font-medium cursor-pointer"
                    >
                      I currently work here
                    </label>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">Description</Label>
                    <Textarea
                      placeholder="Describe your responsibilities and achievements..."
                      value={exp.description}
                      onChange={(e) =>
                        updateExperience(exp.id, {
                          description: e.target.value,
                        })
                      }
                      disabled={isLoading}
                      className="text-sm min-h-24"
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  onClick={() => removeExperience(exp.id)}
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive ml-2"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Button */}
      <Button
        onClick={addExperience}
        variant="outline"
        size="sm"
        disabled={isLoading}
        className="w-full"
      >
        <Plus size={16} className="mr-2" />
        Add Experience
      </Button>
    </div>
  );
};
