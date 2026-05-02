import { useEffect, useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Upload } from "lucide-react";
import TagInput from "@/components/onboarding/TagInput";
import ImageCropDialog from "@/components/portfolio/ImageCropDialog";

interface ProfileForm {
  id: string;
  full_name: string;
  username: string;
  bio: string;
  profession: string;
  location: string;
  avatar_url: string;
}

const EditProfile = () => {
  const { user } = useAuth();
  const [form, setForm] = useState<ProfileForm | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
  const [originalSkills, setOriginalSkills] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropOpen, setCropOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, username, bio, profession, location, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) {
        setLoading(false);
        return;
      }
      setForm({
        id: profile.id,
        full_name: profile.full_name ?? "",
        username: profile.username ?? "",
        bio: profile.bio ?? "",
        profession: profile.profession ?? "",
        location: profile.location ?? "",
        avatar_url: profile.avatar_url ?? "",
      });
      const { data: s } = await supabase.from("skills").select("name").eq("profile_id", profile.id);
      const names = (s ?? []).map((x) => x.name);
      setSkills(names);
      setOriginalSkills(names);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleAvatarPick = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCropOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const uploadCroppedAvatar = async (blob: Blob) => {
    if (!user) return;
    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, blob, { upsert: true, contentType: "image/jpeg" });
    if (error) {
      toast.error("Upload failed");
      setUploading(false);
      return;
    }
    const { data: pub } = supabase.storage.from("avatars").getPublicUrl(path);
    setForm((f) => (f ? { ...f, avatar_url: pub.publicUrl } : f));
    setUploading(false);
    toast.success("Photo updated");
  };

  const save = async () => {
    if (!user || !form) return;
    if (!form.full_name.trim()) {
      toast.error("Name is required");
      return;
    }
    setSaving(true);

    // If username changed, check uniqueness
    if (form.username) {
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", form.username.trim())
        .neq("user_id", user.id)
        .maybeSingle();
      if (existing) {
        toast.error("Username already taken");
        setSaving(false);
        return;
      }
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: form.full_name.trim(),
        username: form.username.trim() || null,
        bio: form.bio.trim() || null,
        profession: form.profession.trim() || null,
        location: form.location.trim() || null,
        avatar_url: form.avatar_url || null,
      })
      .eq("user_id", user.id);

    if (error) {
      toast.error("Could not save profile");
      setSaving(false);
      return;
    }

    // Sync skills (delete removed, insert new)
    const removed = originalSkills.filter((s) => !skills.includes(s));
    const added = skills.filter((s) => !originalSkills.includes(s));
    if (removed.length > 0) {
      await supabase.from("skills").delete().eq("profile_id", form.id).in("name", removed);
    }
    if (added.length > 0) {
      await supabase.from("skills").insert(added.map((name) => ({ profile_id: form.id, name })));
    }
    setOriginalSkills(skills);

    setSaving(false);
    toast.success("Profile saved");
  };

  if (loading || !form) {
    return (
      <DashboardLayout>
        <div className="py-12 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  const initials = (form.full_name || "P")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <DashboardLayout>
      <div className="max-w-3xl space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Edit Profile</h1>
          <p className="text-muted-foreground mt-1">Keep your professional info up to date.</p>
        </div>

        <Card className="p-6 shadow-subtle space-y-5">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              {form.avatar_url && <AvatarImage src={form.avatar_url} alt={form.full_name} />}
              <AvatarFallback className="bg-primary/10 text-primary font-heading font-semibold text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <label className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input text-sm cursor-pointer hover:bg-secondary">
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Change avatar
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarPick(f);
                  e.target.value = "";
                }}
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="p-name">Full name</Label>
              <Input
                id="p-name"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="p-username">Username</Label>
              <Input
                id="p-username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, "") })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="p-prof">Profession</Label>
              <Input
                id="p-prof"
                value={form.profession}
                onChange={(e) => setForm({ ...form, profession: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="p-loc">Location</Label>
              <Input
                id="p-loc"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="p-bio">Bio</Label>
            <Textarea
              id="p-bio"
              rows={4}
              maxLength={300}
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              className="mt-1.5"
            />
            <p className="text-xs text-muted-foreground mt-1">{form.bio.length}/300</p>
          </div>

          <div>
            <Label>Skills</Label>
            <div className="mt-1.5">
              <TagInput value={skills} onChange={setSkills} max={20} placeholder="Add a skill and press Enter" />
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={save} disabled={saving || uploading}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save changes
            </Button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default EditProfile;
