import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { SKILL_PRESETS } from "@/lib/skill-presets";
import type { SkillRow } from "./SkillsSidebar";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  initial: SkillRow[];
  onSaved: (updated: SkillRow[]) => void;
}

// Build a stable key for selection: "<Category>::<Skill>"
const k = (cat: string, name: string) => `${cat}::${name}`;

const EditSkillsDialog = ({ open, onOpenChange, profileId, initial, onSaved }: Props) => {
  // Set of selected "Category::Skill" keys
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  // Map of preset skill name => its category (for reverse lookup)
  const presetSkillToCategory = useMemo(() => {
    const m = new Map<string, string>();
    SKILL_PRESETS.forEach((g) => g.skills.forEach((s) => m.set(s.toLowerCase(), g.category)));
    return m;
  }, []);

  useEffect(() => {
    if (!open) return;
    // Hydrate from existing skills. Match by name (case-insensitive) to a preset
    // category; if it doesn't match, place it under its stored category or "Other".
    const next = new Set<string>();
    initial.forEach((s) => {
      const presetCat = presetSkillToCategory.get(s.name.toLowerCase());
      const cat = presetCat || s.category || "Other";
      next.add(k(cat, s.name));
    });
    setSelected(next);
  }, [open, initial, presetSkillToCategory]);

  const toggle = (cat: string, name: string) => {
    const key = k(cat, name);
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        if (next.size >= 6) {
          toast.error("Maksimal 6 skill");
          return prev;
        }
        next.add(key);
      }
      return next;
    });
  };

  const selectedCount = selected.size;

  const save = async () => {
    setSaving(true);
    // Replace strategy: delete all then insert all selected. Simpler & avoids drift.
    const rows: SkillRow[] = Array.from(selected).map((key) => {
      const [category, name] = key.split("::");
      return { name, category };
    });

    const { error: delErr } = await supabase.from("skills").delete().eq("profile_id", profileId);
    if (delErr) {
      setSaving(false);
      toast.error("Could not update skills");
      return;
    }
    if (rows.length > 0) {
      const { error: insErr } = await supabase
        .from("skills")
        .insert(rows.map((r) => ({ profile_id: profileId, name: r.name, category: r.category })));
      if (insErr) {
        setSaving(false);
        toast.error("Could not save skills");
        return;
      }
    }
    setSaving(false);
    toast.success("Skills updated");
    onSaved(rows);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit your expertise</DialogTitle>
          <DialogDescription>
            Pick the skills that best describe you. They'll appear grouped by category on your
            public portfolio.
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills or category…"
            className="pl-9"
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{selectedCount}/6 selected</span>
          {selectedCount > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setSelected(new Set())}
            >
              Clear all
            </Button>
          )}
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 pb-4">
            {SKILL_PRESETS.map((group) => {
              const q = query.trim().toLowerCase();
              const matchesCategory = q && group.category.toLowerCase().includes(q);
              const visibleSkills = !q
                ? group.skills
                : matchesCategory
                  ? group.skills
                  : group.skills.filter((s) => s.toLowerCase().includes(q));
              if (visibleSkills.length === 0) return null;
              const groupSelected = group.skills.filter((s) =>
                selected.has(k(group.category, s)),
              ).length;
              return (
                <section key={group.category}>
                  <div className="flex items-baseline justify-between gap-3 mb-2">
                    <div>
                      <h3 className="font-heading font-semibold text-sm">{group.category}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">{group.description}</p>
                    </div>
                    {groupSelected > 0 && (
                      <Badge variant="secondary" className="font-normal shrink-0">
                        {groupSelected}
                      </Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {visibleSkills.map((skill) => {
                      const key = k(group.category, skill);
                      const checked = selected.has(key);
                      return (
                        <label
                          key={skill}
                          className={`flex items-center gap-2 rounded-md border px-3 py-2 cursor-pointer transition-colors text-sm ${
                            checked
                              ? "border-primary bg-primary/5"
                              : "border-border hover:bg-secondary"
                          }`}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggle(group.category, skill)}
                            aria-label={skill}
                          />
                          <span className="truncate">{skill}</span>
                        </label>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditSkillsDialog;
