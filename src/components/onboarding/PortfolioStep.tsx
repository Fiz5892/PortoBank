import { PortfolioEntry } from '@/types/onboarding';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, Trash2, X } from 'lucide-react';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

interface PortfolioStepProps {
  data: PortfolioEntry[];
  onChange: (data: PortfolioEntry[]) => void;
  isLoading?: boolean;
}

export const PortfolioStep = ({
  data,
  onChange,
  isLoading,
}: PortfolioStepProps) => {
  const addProject = () => {
    onChange([
      ...data,
      {
        id: generateId(),
        title: '',
        description: '',
        tech_stack: [],
        demo_url: undefined,
        repository_url: undefined,
        year: new Date().getFullYear(),
      },
    ]);
  };

  const removeProject = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  const updateProject = (id: string, updates: Partial<PortfolioEntry>) => {
    onChange(
      data.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const addTechStack = (id: string, tech: string) => {
    if (!tech.trim()) return;
    const project = data.find((p) => p.id === id);
    if (!project) return;

    const newStack = tech
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t && !project.tech_stack.includes(t));

    updateProject(id, {
      tech_stack: [...project.tech_stack, ...newStack],
    });
  };

  const removeTech = (id: string, tech: string) => {
    const project = data.find((p) => p.id === id);
    if (!project) return;

    updateProject(id, {
      tech_stack: project.tech_stack.filter((t) => t !== tech),
    });
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {data.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Add your portfolio projects
          </p>
        ) : (
          data.map((project) => (
            <Card key={project.id} className="p-4 space-y-3">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-semibold">Project</h3>
                <Button
                  onClick={() => removeProject(project.id)}
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 size={16} />
                </Button>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <Label className="text-xs">Project Title *</Label>
                <Input
                  placeholder="E-commerce Platform"
                  value={project.title}
                  onChange={(e) =>
                    updateProject(project.id, { title: e.target.value })
                  }
                  disabled={isLoading}
                  className="text-sm"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label className="text-xs">
                  Description (max 200 chars)
                </Label>
                <Textarea
                  placeholder="Brief description of the project..."
                  value={project.description}
                  onChange={(e) =>
                    updateProject(project.id, {
                      description: e.target.value.slice(0, 200),
                    })
                  }
                  disabled={isLoading}
                  maxLength={200}
                  className="text-sm min-h-20"
                />
                <p className="text-xs text-gray-500">
                  {project.description.length}/200 characters
                </p>
              </div>

              {/* Year */}
              <div className="space-y-1.5">
                <Label className="text-xs">Year *</Label>
                <Input
                  type="number"
                  placeholder="2024"
                  value={project.year}
                  onChange={(e) =>
                    updateProject(project.id, {
                      year: parseInt(e.target.value) || 0,
                    })
                  }
                  disabled={isLoading}
                  className="text-sm"
                />
              </div>

              {/* Tech Stack */}
              <div className="space-y-2">
                <Label className="text-xs">Tech Stack</Label>
                <div className="space-y-1.5">
                  <Input
                    placeholder="React, Node.js, Tailwind (comma-separated)"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addTechStack(
                          project.id,
                          (e.currentTarget as HTMLInputElement).value
                        );
                        (e.currentTarget as HTMLInputElement).value = '';
                      }
                    }}
                    disabled={isLoading}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-500">
                    Press Enter to add tech
                  </p>
                </div>

                {project.tech_stack.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {project.tech_stack.map((tech) => (
                      <div
                        key={tech}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-xs flex items-center gap-1"
                      >
                        {tech}
                        <button
                          onClick={() => removeTech(project.id, tech)}
                          disabled={isLoading}
                          className="hover:text-gray-500"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* URLs */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Demo URL</Label>
                  <Input
                    type="url"
                    placeholder="https://..."
                    value={project.demo_url || ''}
                    onChange={(e) =>
                      updateProject(project.id, {
                        demo_url: e.target.value || undefined,
                      })
                    }
                    disabled={isLoading}
                    className="text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Repository URL</Label>
                  <Input
                    type="url"
                    placeholder="https://github.com/..."
                    value={project.repository_url || ''}
                    onChange={(e) =>
                      updateProject(project.id, {
                        repository_url: e.target.value || undefined,
                      })
                    }
                    disabled={isLoading}
                    className="text-sm"
                  />
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Button */}
      <Button
        onClick={addProject}
        variant="outline"
        size="sm"
        disabled={isLoading}
        className="w-full"
      >
        <Plus size={16} className="mr-2" />
        Add Project
      </Button>
    </div>
  );
};
