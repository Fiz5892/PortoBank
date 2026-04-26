import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { ProfileContacts } from "./ContactSidebar";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initial: ProfileContacts;
  onSaved: (updated: ProfileContacts) => void;
}

const fields: { key: keyof ProfileContacts; label: string; placeholder: string }[] = [
  { key: "email_contact", label: "Email", placeholder: "you@example.com" },
  { key: "phone", label: "Phone", placeholder: "+62 812 3456 7890" },
  { key: "website_url", label: "Website", placeholder: "https://yourdomain.com" },
  { key: "linkedin_url", label: "LinkedIn URL", placeholder: "https://linkedin.com/in/..." },
  { key: "github_url", label: "GitHub URL", placeholder: "https://github.com/..." },
  { key: "instagram_url", label: "Instagram URL", placeholder: "https://instagram.com/..." },
  { key: "twitter_url", label: "Twitter / X URL", placeholder: "https://x.com/..." },
  { key: "behance_url", label: "Behance URL", placeholder: "https://behance.net/..." },
  { key: "dribbble_url", label: "Dribbble URL", placeholder: "https://dribbble.com/..." },
];

const EditContactDialog = ({ open, onOpenChange, userId, initial, onSaved }: Props) => {
  const [form, setForm] = useState<ProfileContacts>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const save = async () => {
    setSaving(true);
    const payload = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, (v as string | null)?.toString().trim() || null])
    );
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not save contact info");
      return;
    }
    toast.success("Contact info updated");
    onSaved(payload as ProfileContacts);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit contact & socials</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {fields.map((f) => (
            <div key={f.key}>
              <Label htmlFor={`c-${f.key}`}>{f.label}</Label>
              <Input
                id={`c-${f.key}`}
                value={(form[f.key] ?? "") as string}
                onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="mt-1.5"
              />
            </div>
          ))}
        </div>
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

export default EditContactDialog;
