import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import type { ExperienceRow } from "./ExperienceSection";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  experiences: ExperienceRow[];
  onChanged: () => void;
}

const empty: Omit<ExperienceRow, "id"> = {
  job_title: "",
  company_name: "",
  employment_type: "Full-time",
  start_date: null,
  end_date: null,
  is_current: false,
  location: "",
  description: "",
  company_logo_url: "",
};

const EditExperienceDialog = ({ open, onOpenChange, userId, experiences, onChanged }: Props) => {
  const [items, setItems] = useState<ExperienceRow[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ExperienceRow, "id">>(empty);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setItems(experiences);
      setShowForm(false);
      setEditingId(null);
    }
  }, [open, experiences]);

  const startNew = () => {
    setForm(empty);
    setEditingId(null);
    setShowForm(true);
  };

  const startEdit = (exp: ExperienceRow) => {
    setForm({ ...exp });
    setEditingId(exp.id);
    setShowForm(true);
  };

  const save = async () => {
    if (!form.job_title.trim() || !form.company_name.trim()) {
      toast.error("Job title and company are required");
      return;
    }
    setSaving(true);
    const payload = {
      job_title: form.job_title.trim(),
      company_name: form.company_name.trim(),
      employment_type: form.employment_type || null,
      start_date: form.start_date || null,
      end_date: form.is_current ? null : form.end_date || null,
      is_current: form.is_current,
      location: form.location?.trim() || null,
      description: form.description?.trim() || null,
      company_logo_url: form.company_logo_url?.trim() || null,
    };
    if (editingId) {
      const { error } = await supabase.from("experiences").update(payload).eq("id", editingId);
      if (error) {
        toast.error("Update failed");
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase.from("experiences").insert({ ...payload, user_id: userId });
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
    if (!confirm("Delete this experience?")) return;
    const { error } = await supabase.from("experiences").delete().eq("id", id);
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
          <DialogTitle>Edit experience</DialogTitle>
        </DialogHeader>

        {!showForm && (
          <div className="space-y-2">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground">No experience yet.</p>
            )}
            {items.map((it) => (
              <Card key={it.id} className="p-3 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium truncate">{it.job_title}</p>
                  <p className="text-xs text-muted-foreground truncate">{it.company_name}</p>
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
              <Plus className="h-4 w-4 mr-2" /> Add experience
            </Button>
          </div>
        )}

        {showForm && (
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="x-title">Job title *</Label>
                <Input id="x-title" value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="x-company">Company *</Label>
                <Input id="x-company" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="x-type">Employment type</Label>
                <Select value={form.employment_type ?? undefined} onValueChange={(v) => setForm({ ...form, employment_type: v })}>
                  <SelectTrigger id="x-type" className="mt-1.5"><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Full-time">Full-time</SelectItem>
                    <SelectItem value="Part-time">Part-time</SelectItem>
                    <SelectItem value="Freelance">Freelance</SelectItem>
                    <SelectItem value="Internship">Internship</SelectItem>
                    <SelectItem value="Contract">Contract</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="x-loc">Location</Label>
                <Input id="x-loc" value={form.location ?? ""} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="x-start">Start date</Label>
                <Input id="x-start" type="date" value={form.start_date ?? ""} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1.5" />
              </div>
              <div>
                <Label htmlFor="x-end">End date</Label>
                <Input id="x-end" type="date" disabled={form.is_current} value={form.end_date ?? ""} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="mt-1.5" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox checked={form.is_current} onCheckedChange={(v) => setForm({ ...form, is_current: !!v })} />
              I currently work here
            </label>
            <div>
              <Label htmlFor="x-logo">Company logo URL (optional)</Label>
              <Input id="x-logo" value={form.company_logo_url ?? ""} onChange={(e) => setForm({ ...form, company_logo_url: e.target.value })} placeholder="https://..." className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="x-desc">Description</Label>
              <Textarea id="x-desc" rows={4} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" />
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

export default EditExperienceDialog;
