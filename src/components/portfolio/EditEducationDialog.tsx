import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import type { EducationRow } from "./EducationSection";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  educations: EducationRow[];
  onChanged: () => void;
}

const empty: Omit<EducationRow, "id"> = {
  degree: "",
  field_of_study: "",
  institution_name: "",
  start_year: null,
  end_year: null,
  gpa: "",
  description: "",
  institution_logo_url: "",
};

const EditEducationDialog = ({ open, onOpenChange, userId, educations, onChanged }: Props) => {
  const [items, setItems] = useState<EducationRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<EducationRow, "id">>(empty);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setItems(educations);
      setShowForm(false);
      setEditingId(null);
    }
  }, [open, educations]);

  const startNew = () => {
    setForm(empty);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (ed: EducationRow) => {
    setForm({ ...ed });
    setEditingId(ed.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.degree.trim() || !form.institution_name.trim()) {
      toast.error("Degree and institution are required");
      return;
    }
    setSaving(true);
    const payload = {
      degree: form.degree.trim(),
      field_of_study: form.field_of_study?.trim() || null,
      institution_name: form.institution_name.trim(),
      start_year: form.start_year || null,
      end_year: form.end_year || null,
      gpa: form.gpa?.trim() || null,
      description: form.description?.trim() || null,
      institution_logo_url: form.institution_logo_url?.trim() || null,
    };
    if (editingId) {
      const { error } = await supabase.from("educations").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Update failed");
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("educations").insert({ ...payload, user_id: userId });
      if (error) {
        toast.error("Add failed");
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setShowForm(false);
    toast.success("Saved");
    onChanged();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this education entry?")) return;
    const { error } = await supabase.from("educations").delete().eq("id", id);
    if (error) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Deleted");
    onChanged();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit education</DialogTitle>
        </DialogHeader>

        {!showForm && (
          <div className="space-y-2">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">No education yet.</p>
            )}
            {items.map((it) => (
              <Card key={it.id} className="p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{it.degree}</p>
                  <p className="text-xs text-muted-foreground truncate">{it.institution_name}</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => startEdit(it)} aria-label="Edit">
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(it.id)}
                    aria-label="Delete"
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
            <Button variant="outline" onClick={startNew} className="w-full">
              <Plus className="h-4 w-4 mr-2" /> Add education
            </Button>
          </div>
        )}

        {showForm && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="e-degree">Degree *</Label>
                <Input id="e-degree" value={form.degree} onChange={(e) => setForm({ ...form, degree: e.target.value })} placeholder="Bachelor of Computer Science" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="e-field">Field of study</Label>
                <Input id="e-field" value={form.field_of_study ?? ""} onChange={(e) => setForm({ ...form, field_of_study: e.target.value })} className="mt-1.5" />
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="e-inst">Institution *</Label>
                <Input id="e-inst" value={form.institution_name} onChange={(e) => setForm({ ...form, institution_name: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="e-start">Start year</Label>
                <Input
                  id="e-start"
                  type="number"
                  min={1900}
                  max={2100}
                  value={form.start_year ?? ""}
                  onChange={(e) => setForm({ ...form, start_year: e.target.value ? parseInt(e.target.value) : null })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="e-end">End year</Label>
                <Input
                  id="e-end"
                  type="number"
                  min={1900}
                  max={2100}
                  value={form.end_year ?? ""}
                  onChange={(e) => setForm({ ...form, end_year: e.target.value ? parseInt(e.target.value) : null })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="e-gpa">GPA</Label>
                <Input id="e-gpa" value={form.gpa ?? ""} onChange={(e) => setForm({ ...form, gpa: e.target.value })} placeholder="3.8/4.0" className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="e-logo">Institution logo URL</Label>
                <Input id="e-logo" value={form.institution_logo_url ?? ""} onChange={(e) => setForm({ ...form, institution_logo_url: e.target.value })} placeholder="https://..." className="mt-1.5" />
              </div>
            </div>
            <div>
              <Label htmlFor="e-desc">Description / achievements</Label>
              <Textarea id="e-desc" rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" />
            </div>
          </div>
        )}

        <DialogFooter>
          {showForm ? (
            <>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Back</Button>
              <Button onClick={save} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Update" : "Add"}
              </Button>
            </>
          ) : (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditEducationDialog;
