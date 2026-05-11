import { EducationEntry } from '@/types/onboarding';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, Upload } from 'lucide-react';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface EducationStepProps {
  data: EducationEntry[];
  onChange: (data: EducationEntry[]) => void;
  isLoading?: boolean;
}

export const EducationStep = ({ data, onChange, isLoading }: EducationStepProps) => {
  const addEducation = () => {
    onChange([
      ...data,
      {
        id: generateId(),
        institution_name: '',
        degree: '',
        field_of_study: '',
        start_year: new Date().getFullYear(),
        end_year: new Date().getFullYear(),
        gpa: undefined,
        description: '',
        logo_url: undefined,
      },
    ]);
  };

  const removeEducation = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  const updateEducation = (id: string, updates: Partial<EducationEntry>) => {
    onChange(
      data.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const handleLogoChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      updateEducation(id, { logo_url: event.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Add your education history
          </p>
        ) : (
          data.map((edu) => (
            <Card key={edu.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Logo Upload */}
                  <div className="flex items-center gap-3 mb-3">
                    {edu.logo_url ? (
                      <img
                        src={edu.logo_url}
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
                        onChange={(e) => handleLogoChange(edu.id, e)}
                        className="hidden"
                        disabled={isLoading}
                      />
                    </label>
                  </div>

                  {/* Institution Name */}
                  <div className="space-y-1.5 mb-3">
                    <Label className="text-xs">Institution Name *</Label>
                    <Input
                      placeholder="University of Indonesia"
                      value={edu.institution_name}
                      onChange={(e) =>
                        updateEducation(edu.id, {
                          institution_name: e.target.value,
                        })
                      }
                      disabled={isLoading}
                      className="text-sm"
                    />
                  </div>

                  {/* Degree */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Degree *</Label>
                      <Input
                        placeholder="S1, Bachelor's, Master's"
                        value={edu.degree}
                        onChange={(e) =>
                          updateEducation(edu.id, { degree: e.target.value })
                        }
                        disabled={isLoading}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Field of Study *</Label>
                      <Input
                        placeholder="Computer Science"
                        value={edu.field_of_study}
                        onChange={(e) =>
                          updateEducation(edu.id, {
                            field_of_study: e.target.value,
                          })
                        }
                        disabled={isLoading}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Years */}
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Start Year *</Label>
                      <Input
                        type="number"
                        placeholder="2020"
                        value={edu.start_year}
                        onChange={(e) =>
                          updateEducation(edu.id, {
                            start_year: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={isLoading}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">End Year *</Label>
                      <Input
                        type="number"
                        placeholder="2024"
                        value={edu.end_year}
                        onChange={(e) =>
                          updateEducation(edu.id, {
                            end_year: parseInt(e.target.value) || 0,
                          })
                        }
                        disabled={isLoading}
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">GPA (Optional)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="3.5"
                        value={edu.gpa || ''}
                        onChange={(e) =>
                          updateEducation(edu.id, {
                            gpa: e.target.value ? parseFloat(e.target.value) : undefined,
                          })
                        }
                        disabled={isLoading}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-1.5">
                    <Label className="text-xs">
                      Description (Optional)
                    </Label>
                    <Textarea
                      placeholder="Achievements, awards, or activities..."
                      value={edu.description}
                      onChange={(e) =>
                        updateEducation(edu.id, {
                          description: e.target.value,
                        })
                      }
                      disabled={isLoading}
                      className="text-sm min-h-20"
                    />
                  </div>
                </div>

                {/* Remove Button */}
                <Button
                  onClick={() => removeEducation(edu.id)}
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
        onClick={addEducation}
        variant="outline"
        size="sm"
        disabled={isLoading}
        className="w-full"
      >
        <Plus size={16} className="mr-2" />
        Add Education
      </Button>
    </div>
  );
};
