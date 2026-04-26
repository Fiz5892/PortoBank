import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";

interface ProfileForm {
  full_name: string;
  username: string;
  bio: string;
  profession: string;
  location: string;
  avatar_url: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  initial: ProfileForm;
  onSaved: (updated: ProfileForm) => void;
}

const EditProfileInfoDialog = ({ open, onOpenChange, userId, initial, onSaved }: Props) => {
  const [form, setForm] = useState<ProfileForm>(initial);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (open) setForm(initial);
  }, [open, initial]);

  const handleAvatar = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image must be under 2MB");
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((f) => ({ ...f, avatar_url: pub.publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    if (!form.full_name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);
    if (form.username) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", form.username.trim())
        .neq("user_id", userId)
        .maybeSingle();
      if (existing) {
        toast.error("Username already taken");
        setSaving(false);
        return;
      }
    }
    const payload = {
      full_name: form.full_name.trim(),
      username: form.username.trim() || null,
      bio: form.bio.trim() || null,
      profession: form.profession.trim() || null,
      location: form.location.trim() || null,
      avatar_url: form.avatar_url || null,
    };
    const { error } = await supabase.from("profiles").update(payload).eq("user_id", userId);
    setSaving(false);
    if (error) {
      toast.error("Could not save");
      return;
    }
    toast.success("Profile updated");
    onSaved({
      full_name: payload.full_name,
      username: payload.username ?? "",
      bio: payload.bio ?? "",
      profession: payload.profession ?? "",
      location: payload.location ?? "",
      avatar_url: payload.avatar_url ?? "",
    });
    onOpenChange(false);
  };

  const initials = (form.full_name || "P")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit profile info</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              {form.avatar_url && <AvatarImage src={form.avatar_url} alt={form.full_name} />}
              <AvatarFallback className="bg-primary/10 text-primary font-heading font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input text-sm cursor-pointer hover:bg-secondary">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Change photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatar(f);
                }}
              />
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="ep-name">Full name</Label>
              <Input id="ep-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="ep-user">Username</Label>
              <Input
                id="ep-user"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="ep-prof">Profession</Label>
              <Input id="ep-prof" value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="ep-loc">Location</Label>
              <Input id="ep-loc" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="mt-1.5" />
            </div>
          </div>
          <div>
            <Label htmlFor="ep-bio">Bio</Label>
            <Textarea
              id="ep-bio"
              rows={4}
              maxLength={300}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">{form.bio.length}/300</p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={saving || uploading}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EditProfileInfoDialog;
