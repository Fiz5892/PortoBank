import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import TagInput from "@/components/onboarding/TagInput";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { SkillRow } from "./SkillsSidebar";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  initial: SkillRow[];
  onSaved: (updated: SkillRow[]) => void;
}

const EditSkillsDialog = ({ open, onOpenChange, profileId, initial, onSaved }: Props) => {
  const [skills, setSkills] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setSkills(initial.map((s) => s.name));
  }, [open, initial]);

  const save = async () => {
    setSaving(true);
    const original = initial.map((s) => s.name);
    const removed = original.filter((s) => !skills.includes(s));
    const added = skills.filter((s) => !original.includes(s));
    if (removed.length > 0) {
      await supabase.from("skills").delete().eq("profile_id", profileId).in("name", removed);
    }
    if (added.length > 0) {
      await supabase
        .from("skills")
        .insert(added.map((name) => ({ profile_id: profileId, name })));
    }
    setSaving(false);
    toast.success("Skills updated");
    onSaved(skills.map((name) => ({ name, category: initial.find((s) => s.name === name)?.category ?? null })));
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit skills</DialogTitle>
        </DialogHeader>
        <TagInput value={skills} onChange={setSkills} max={20} placeholder="Add a skill and press Enter" />
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
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
