import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import TagInput from "@/components/onboarding/TagInput";
import { SUGGESTED_SKILLS, slugifyName } from "@/lib/onboarding";
import { toast } from "sonner";
import {
  Camera,
  Loader2,
  CheckCircle2,
  Sparkles,
  Upload,
  PenLine,
  ArrowRight,
  ArrowLeft,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const STEPS = ["Profile", "Skills", "Portfolio"] as const;

const profileSchema = z.object({
  full_name: z.string().trim().min(1, "Name is required").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters")
    .max(24, "Username must be 24 characters or less")
    .regex(/^[a-z0-9_]+$/, "Lowercase letters, numbers and underscores only"),
  profession: z.string().trim().min(1, "Profession is required").max(100),
  location: z.string().trim().max(100).optional().or(z.literal("")),
  bio: z.string().trim().max(300, "Bio must be 300 characters or less").optional().or(z.literal("")),
});

interface ExtractedCV {
  full_name: string;
  bio: string;
  skills: string[];
  experience: { title: string; company: string; duration: string }[];
  projects: { title: string; description: string }[];
}

const Onboarding = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Step 1 — profile
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [profile, setProfile] = useState({
    full_name: "",
    username: "",
    profession: "",
    location: "",
    bio: "",
  });
  const [profileErrors, setProfileErrors] = useState<Partial<Record<keyof typeof profile, string>>>({});
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);

  // Step 2 — skills
  const [skills, setSkills] = useState<string[]>([]);
  const [savingSkills, setSavingSkills] = useState(false);

  // Step 3 — CV upload / AI extraction
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState<ExtractedCV | null>(null);
  const [savingPortfolio, setSavingPortfolio] = useState(false);

  // Auth guard + load existing profile
  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, full_name, username, profession, location, bio, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) {
        setProfileId(data.id);
        setProfile({
          full_name: data.full_name ?? user.user_metadata?.full_name ?? "",
          username: data.username ?? slugifyName(data.full_name ?? user.user_metadata?.full_name ?? ""),
          profession: data.profession ?? "",
          location: data.location ?? "",
          bio: data.bio ?? "",
        });
        setAvatarUrl(data.avatar_url);
        setAvatarPreview(data.avatar_url);
      } else {
        const fn = (user.user_metadata?.full_name as string) ?? "";
        setProfile((p) => ({ ...p, full_name: fn, username: slugifyName(fn) }));
      }
    };
    load();
  }, [user, loading, navigate]);

  // Username availability check (debounced)
  useEffect(() => {
    const u = profile.username.trim().toLowerCase();
    if (!u || u.length < 3 || !/^[a-z0-9_]+$/.test(u)) {
      setUsernameAvailable(null);
      return;
    }
    setUsernameChecking(true);
    const t = setTimeout(async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", u)
        .maybeSingle();
      const taken = data && data.user_id !== user?.id;
      setUsernameAvailable(!taken);
      setUsernameChecking(false);
    }, 350);
    return () => {
      clearTimeout(t);
      setUsernameChecking(false);
    };
  }, [profile.username, user?.id]);

  const onAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Avatar must be smaller than 2 MB.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return avatarUrl;
    const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
    if (error) {
      toast.error("Could not upload avatar.");
      return avatarUrl;
    }
    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return data.publicUrl;
  };

  const saveStep1 = async () => {
    const parsed = profileSchema.safeParse(profile);
    if (!parsed.success) {
      const errs: typeof profileErrors = {};
      parsed.error.errors.forEach((e) => {
        errs[e.path[0] as keyof typeof profile] = e.message;
      });
      setProfileErrors(errs);
      return;
    }
    if (usernameAvailable === false) {
      setProfileErrors({ username: "This username is already taken" });
      return;
    }
    setProfileErrors({});
    if (!user) return;

    setSavingProfile(true);
    const uploaded = await uploadAvatar();
    setAvatarUrl(uploaded);

    const payload = {
      user_id: user.id,
      full_name: parsed.data.full_name,
      username: parsed.data.username.toLowerCase(),
      profession: parsed.data.profession,
      location: parsed.data.location || null,
      bio: parsed.data.bio || null,
      avatar_url: uploaded,
    };

    let res;
    if (profileId) {
      res = await supabase.from("profiles").update(payload).eq("id", profileId).select("id").single();
    } else {
      res = await supabase.from("profiles").upsert(payload, { onConflict: "user_id" }).select("id").single();
    }
    setSavingProfile(false);

    if (res.error || !res.data) {
      toast.error(res.error?.message ?? "Could not save profile.");
      return;
    }
    setProfileId(res.data.id);

    // Load any existing skills
    const { data: existingSkills } = await supabase
      .from("skills")
      .select("name")
      .eq("profile_id", res.data.id);
    if (existingSkills && existingSkills.length > 0) {
      setSkills(existingSkills.map((s) => s.name));
    }

    setStep(1);
  };

  const saveStep2 = async (skip = false) => {
    if (!profileId) {
      setStep(2);
      return;
    }
    if (skip) {
      setStep(2);
      return;
    }
    setSavingSkills(true);
    // Replace skills: delete then insert
    await supabase.from("skills").delete().eq("profile_id", profileId);
    if (skills.length > 0) {
      const rows = skills.map((name) => ({ profile_id: profileId, name }));
      const { error } = await supabase.from("skills").insert(rows);
      if (error) {
        setSavingSkills(false);
        toast.error("Could not save skills.");
        return;
      }
    }
    setSavingSkills(false);
    setStep(2);
  };

  const onCvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("Please select a PDF file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("CV must be smaller than 5 MB.");
      return;
    }
    setCvFile(file);
    setExtracted(null);
  };

  const extractCv = async () => {
    if (!cvFile || !user) return;
    setExtracting(true);
    try {
      // Convert to base64
      const buf = await cvFile.arrayBuffer();
      let binary = "";
      const bytes = new Uint8Array(buf);
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
      }
      const base64 = btoa(binary);

      // Upload CV to private bucket (best effort, non-blocking)
      const path = `${user.id}/cv-${Date.now()}.pdf`;
      supabase.storage.from("cvs").upload(path, cvFile, { contentType: "application/pdf", upsert: true });

      const { data, error } = await supabase.functions.invoke("extract-cv", {
        body: { pdfBase64: base64 },
      });
      if (error) {
        const msg = (error as { message?: string }).message ?? "Could not extract CV.";
        if (msg.includes("429")) toast.error("Too many requests. Please wait a moment.");
        else if (msg.includes("402")) toast.error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
        else toast.error(msg);
        return;
      }
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setExtracted(data as ExtractedCV);
    } catch (e) {
      console.error(e);
      toast.error("Something went wrong while extracting your CV.");
    } finally {
      setExtracting(false);
    }
  };

  const finishWithExtracted = async () => {
    if (!extracted || !user || !profileId) return;
    setSavingPortfolio(true);

    // Update profile bio if empty / accept extracted bio
    if (extracted.bio) {
      await supabase.from("profiles").update({ bio: extracted.bio.slice(0, 300) }).eq("id", profileId);
    }

    // Merge skills (don't exceed 20)
    const existing = new Set(skills.map((s) => s.toLowerCase()));
    const merged = [...skills];
    for (const s of extracted.skills) {
      if (merged.length >= 20) break;
      if (!existing.has(s.toLowerCase())) merged.push(s);
    }
    if (merged.length > 0) {
      await supabase.from("skills").delete().eq("profile_id", profileId);
      await supabase
        .from("skills")
        .insert(merged.map((name) => ({ profile_id: profileId, name })));
    }

    // Create a portfolio + items from projects + experience
    const { data: portfolio, error: pErr } = await supabase
      .from("portfolios")
      .insert({ user_id: user.id, title: "My Portfolio", is_published: true })
      .select("id")
      .single();
    if (pErr || !portfolio) {
      setSavingPortfolio(false);
      toast.error("Could not create portfolio.");
      return;
    }

    const itemRows = [
      ...extracted.projects.map((p) => ({
        portfolio_id: portfolio.id,
        type: "project",
        title: p.title || "Untitled project",
        description: p.description || null,
        tags: [] as string[],
      })),
      ...extracted.experience.map((e) => ({
        portfolio_id: portfolio.id,
        type: "experience",
        title: `${e.title}${e.company ? " · " + e.company : ""}`,
        description: e.duration || null,
        tags: [] as string[],
      })),
    ];
    if (itemRows.length > 0) {
      await supabase.from("portfolio_items").insert(itemRows);
    }

    await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", profileId);
    setSavingPortfolio(false);
    toast.success("Portfolio created!");
    navigate("/dashboard", { replace: true });
  };

  const finishManually = async () => {
    if (!user) return;
    // Ensure they have at least an empty published portfolio
    const { data: existing } = await supabase
      .from("portfolios")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);
    if (!existing || existing.length === 0) {
      await supabase.from("portfolios").insert({ user_id: user.id, title: "My Portfolio", is_published: false });
    }
    navigate("/dashboard", { replace: true });
  };

  if (loading || !user) {
    return (
      <Layout>
        <section className="container py-20 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </section>
      </Layout>
    );
  }

  const initials = (profile.full_name || user.email || "P")
    .split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();

  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <Layout>
      <section className="container py-10 md:py-14 max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">
              Step {step + 1} of {STEPS.length} —{" "}
              <span className="text-primary">{STEPS[step]}</span>
            </p>
            <p className="text-xs text-muted-foreground">{Math.round(progress)}%</p>
          </div>
          <Progress value={progress} />
        </div>

        {/* STEP 1 */}
        {step === 0 && (
          <Card className="p-6 md:p-8 shadow-subtle">
            <h1 className="font-heading text-2xl font-bold">Set up your profile</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Tell the world a bit about who you are.
            </p>

            <div className="mt-6 flex items-center gap-4">
              <Avatar className="h-20 w-20">
                {avatarPreview && <AvatarImage src={avatarPreview} alt="Avatar" />}
                <AvatarFallback className="bg-primary/10 text-primary font-heading font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label className="cursor-pointer">
                <input type="file" accept="image/*" className="hidden" onChange={onAvatarChange} />
                <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-input text-sm font-medium hover:bg-secondary">
                  <Camera className="h-4 w-4" />
                  {avatarPreview ? "Change photo" : "Upload photo"}
                </span>
                <p className="text-xs text-muted-foreground mt-1.5">PNG or JPG, up to 2 MB.</p>
              </label>
            </div>

            <div className="mt-6 space-y-4">
              <div>
                <Label htmlFor="full_name">Full name</Label>
                <Input
                  id="full_name"
                  value={profile.full_name}
                  onChange={(e) => {
                    const fn = e.target.value;
                    setProfile((p) => ({
                      ...p,
                      full_name: fn,
                      username: p.username || slugifyName(fn),
                    }));
                  }}
                  className="mt-1.5"
                />
                {profileErrors.full_name && (
                  <p className="text-xs text-destructive mt-1">{profileErrors.full_name}</p>
                )}
              </div>

              <div>
                <Label htmlFor="username">Username</Label>
                <div className="relative mt-1.5">
                  <Input
                    id="username"
                    value={profile.username}
                    onChange={(e) =>
                      setProfile((p) => ({ ...p, username: e.target.value.toLowerCase() }))
                    }
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameChecking && (
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                    {!usernameChecking && usernameAvailable === true && (
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                    )}
                    {!usernameChecking && usernameAvailable === false && (
                      <X className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  portobank.app/<span className="font-medium">{profile.username || "username"}</span>
                </p>
                {profileErrors.username && (
                  <p className="text-xs text-destructive mt-1">{profileErrors.username}</p>
                )}
                {!profileErrors.username && usernameAvailable === false && (
                  <p className="text-xs text-destructive mt-1">This username is already taken.</p>
                )}
              </div>

              <div>
                <Label htmlFor="profession">Profession / job title</Label>
                <Input
                  id="profession"
                  value={profile.profession}
                  onChange={(e) => setProfile((p) => ({ ...p, profession: e.target.value }))}
                  placeholder="e.g. Photographer, Architect, Backend Engineer"
                  className="mt-1.5"
                />
                {profileErrors.profession && (
                  <p className="text-xs text-destructive mt-1">{profileErrors.profession}</p>
                )}
              </div>

              <div>
                <Label htmlFor="location">Location <span className="text-muted-foreground">(optional)</span></Label>
                <Input
                  id="location"
                  value={profile.location}
                  onChange={(e) => setProfile((p) => ({ ...p, location: e.target.value }))}
                  placeholder="City, Country"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="bio">Short bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value.slice(0, 300) }))}
                  rows={4}
                  placeholder="A few sentences about your work and what you're known for."
                  className="mt-1.5"
                />
                <div className="flex justify-end">
                  <span className={`text-xs mt-1 ${profile.bio.length >= 300 ? "text-destructive" : "text-muted-foreground"}`}>
                    {profile.bio.length} / 300
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={saveStep1} disabled={savingProfile}>
                {savingProfile && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}

        {/* STEP 2 */}
        {step === 1 && (
          <Card className="p-6 md:p-8 shadow-subtle">
            <h1 className="font-heading text-2xl font-bold">Add your skills</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Help others discover you. Add up to 20 skills.
            </p>

            <div className="mt-6">
              <TagInput
                value={skills}
                onChange={setSkills}
                suggestions={SUGGESTED_SKILLS}
                max={20}
                placeholder="e.g. Photography, Branding, Project Management"
              />
            </div>

            {skills.length === 0 && (
              <div className="mt-6">
                <p className="text-xs font-semibold text-muted-foreground mb-2">POPULAR</p>
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_SKILLS.slice(0, 10).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSkills((cur) => (cur.includes(s) ? cur : [...cur, s]))}
                    >
                      <Badge variant="outline" className="font-normal hover:bg-secondary cursor-pointer">
                        + {s}
                      </Badge>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setStep(0)}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => saveStep2(true)} disabled={savingSkills}>
                  Skip
                </Button>
                <Button onClick={() => saveStep2(false)} disabled={savingSkills}>
                  {savingSkills && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Next <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* STEP 3 */}
        {step === 2 && (
          <Card className="p-6 md:p-8 shadow-subtle">
            <h1 className="font-heading text-2xl font-bold">Build your portfolio</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Get a head start with AI, or set things up yourself.
            </p>

            {!extracted && !extracting && (
              <div className="mt-6 grid md:grid-cols-2 gap-4">
                {/* Option A */}
                <label className="block cursor-pointer">
                  <input type="file" accept="application/pdf" className="hidden" onChange={onCvFile} />
                  <Card className="p-5 border-2 border-dashed hover:border-primary transition-colors h-full">
                    <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center mb-3">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading font-semibold">Upload your CV</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Let PortoBank AI read your CV and pre-fill your portfolio.
                    </p>
                    <div className="mt-4 inline-flex items-center text-sm text-primary font-medium">
                      <Upload className="h-4 w-4 mr-1.5" />
                      {cvFile ? cvFile.name : "Choose PDF (max 5 MB)"}
                    </div>
                  </Card>
                </label>

                {/* Option B */}
                <button type="button" onClick={finishManually} className="text-left">
                  <Card className="p-5 border-2 hover:border-primary transition-colors h-full">
                    <div className="h-10 w-10 rounded-md bg-secondary text-foreground flex items-center justify-center mb-3">
                      <PenLine className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading font-semibold">Fill manually</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Skip for now and build your portfolio piece by piece.
                    </p>
                    <div className="mt-4 inline-flex items-center text-sm text-primary font-medium">
                      Go to dashboard <ArrowRight className="h-4 w-4 ml-1.5" />
                    </div>
                  </Card>
                </button>
              </div>
            )}

            {cvFile && !extracted && !extracting && (
              <div className="mt-6 flex items-center justify-between">
                <Button variant="ghost" onClick={() => setStep(1)}>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button onClick={extractCv}>
                  <Sparkles className="mr-2 h-4 w-4" /> Extract with AI
                </Button>
              </div>
            )}

            {extracting && (
              <div className="mt-10 text-center py-12">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
                <p className="font-heading font-semibold">PortoBank AI is reading your CV…</p>
                <p className="text-sm text-muted-foreground mt-1">This usually takes 10-20 seconds.</p>
              </div>
            )}

            {extracted && !extracting && (
              <div className="mt-6 space-y-5">
                <div className="rounded-md bg-secondary/60 border border-border p-4">
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4 text-primary" /> Here's what we found — review and edit before saving.
                  </p>
                </div>

                <div>
                  <Label>Bio (2 sentences)</Label>
                  <Textarea
                    value={extracted.bio}
                    onChange={(e) => setExtracted({ ...extracted, bio: e.target.value.slice(0, 300) })}
                    rows={3}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Skills extracted</Label>
                  <div className="mt-1.5">
                    <TagInput
                      value={extracted.skills}
                      onChange={(v) => setExtracted({ ...extracted, skills: v })}
                      suggestions={SUGGESTED_SKILLS}
                      max={20}
                    />
                  </div>
                </div>

                {extracted.experience.length > 0 && (
                  <div>
                    <Label>Experience ({extracted.experience.length})</Label>
                    <div className="mt-1.5 space-y-2">
                      {extracted.experience.map((e, i) => (
                        <div key={i} className="rounded-md border border-border p-3 text-sm">
                          <p className="font-medium">{e.title}</p>
                          <p className="text-muted-foreground">{e.company} · {e.duration}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {extracted.projects.length > 0 && (
                  <div>
                    <Label>Projects ({extracted.projects.length})</Label>
                    <div className="mt-1.5 space-y-2">
                      {extracted.projects.map((p, i) => (
                        <div key={i} className="rounded-md border border-border p-3 text-sm">
                          <p className="font-medium">{p.title}</p>
                          <p className="text-muted-foreground line-clamp-2">{p.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <Button variant="ghost" onClick={() => { setExtracted(null); setCvFile(null); }}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Try another CV
                  </Button>
                  <Button onClick={finishWithExtracted} disabled={savingPortfolio}>
                    {savingPortfolio && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Save & finish <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </section>
    </Layout>
  );
};

export default Onboarding;
