import { SkillEntry } from '@/types/onboarding';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, X } from 'lucide-react';
import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const CATEGORIES = [
  'Programming Language',
  'Framework & Library',
  'Design Tool',
  'Database',
  'DevOps & Cloud',
  'Soft Skill',
  'Bahasa',
  'Lainnya',
] as const;

const LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

const SUGGESTED_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'AWS',
  'Figma', 'UI Design', 'UX Research', 'Branding',
  'Project Management', 'Marketing', 'SEO', 'Public Speaking',
  'Leadership', 'Team Management', 'Communication', 'Problem Solving',
];

interface SkillsStepProps {
  data: SkillEntry[];
  onChange: (data: SkillEntry[]) => void;
  isLoading?: boolean;
}

export const SkillsStep = ({
  data,
  onChange,
  isLoading,
}: SkillsStepProps) => {
  const [newSkill, setNewSkill] = useState('');
  const [newCategory, setNewCategory] = useState<SkillEntry['category']>('Programming Language');
  const [newLevel, setNewLevel] = useState<SkillEntry['level']>('Intermediate');

  const addSkill = () => {
    if (!newSkill.trim()) return;

    onChange([
      ...data,
      {
        id: generateId(),
        name: newSkill.trim(),
        category: newCategory,
        level: newLevel,
      },
    ]);

    setNewSkill('');
    setNewCategory('Programming Language');
    setNewLevel('Intermediate');
  };

  const removeSkill = (id: string) => {
    onChange(data.filter((item) => item.id !== id));
  };

  const updateSkill = (id: string, updates: Partial<SkillEntry>) => {
    onChange(
      data.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      )
    );
  };

  const filteredSuggestions = SUGGESTED_SKILLS.filter(
    (skill) =>
      !data.some((s) => s.name.toLowerCase() === skill.toLowerCase()) &&
      skill.toLowerCase().includes(newSkill.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Add Skill Form */}
      <Card className="p-4 space-y-3">
        <h3 className="text-sm font-semibold">Add New Skill</h3>

        <div className="space-y-1.5">
          <Label className="text-xs">Skill Name *</Label>
          <div className="relative">
            <Input
              placeholder="e.g., React, Figma, Leadership..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              disabled={isLoading}
              className="text-sm"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill();
                }
              }}
            />
            {filteredSuggestions.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-900 shadow-lg z-10">
                {filteredSuggestions.slice(0, 5).map((skill) => (
                  <button
                    key={skill}
                    onClick={() => {
                      setNewSkill(skill);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
                  >
                    {skill}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Category *</Label>
            <Select value={newCategory} onValueChange={(value) => setNewCategory(value as SkillEntry['category'])} disabled={isLoading}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Level *</Label>
            <Select value={newLevel} onValueChange={(value) => setNewLevel(value as SkillEntry['level'])} disabled={isLoading}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((level) => (
                  <SelectItem key={level} value={level}>
                    {level}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={addSkill}
          disabled={!newSkill.trim() || isLoading}
          className="w-full"
          size="sm"
        >
          <Plus size={16} className="mr-2" />
          Add Skill
        </Button>
      </Card>

      {/* Skills List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Your Skills</h3>
        {data.length === 0 ? (
          <p className="text-sm text-gray-500 italic">
            Add your skills to showcase your expertise
          </p>
        ) : (
          <div className="space-y-2">
            {data.map((skill) => (
              <div
                key={skill.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="flex-1 text-sm">
                  <div className="font-medium text-gray-900 dark:text-gray-50">
                    {skill.name}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {skill.category} • {skill.level}
                  </div>
                </div>
                <Button
                  onClick={() => removeSkill(skill.id)}
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  className="text-destructive hover:text-destructive"
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Skill Count */}
      <p className="text-xs text-gray-500 text-center">
        {data.length} skill{data.length !== 1 ? 's' : ''} added
      </p>
    </div>
  );
};
