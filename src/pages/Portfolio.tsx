import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  MapPin,
  Share2,
  Download,
  Loader2,
  Mail,
  MoreHorizontal,
  Flag,
  LogIn,
  Lock,
  Eye,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import ProjectModal, { PortfolioItemData } from "@/components/portfolio/ProjectModal";
import { fetchCVDataByUserId } from "@/lib/cv-data";
import { downloadCV } from "@/lib/cv-pdf";
import LikeButton from "@/components/social/LikeButton";
import LoginToActModal from "@/components/social/LoginToActModal";
import ReportProfileDialog from "@/components/social/ReportProfileDialog";
import { useSEO } from "@/hooks/useSEO";

import SkillsSidebar, { SkillRow } from "@/components/portfolio/SkillsSidebar";
import ContactSidebar, { ProfileContacts } from "@/components/portfolio/ContactSidebar";
import ExperienceSection, { ExperienceRow } from "@/components/portfolio/ExperienceSection";
import EducationSection, { EducationRow } from "@/components/portfolio/EducationSection";
import ProjectsSection from "@/components/portfolio/ProjectsSection";
import EditProfileInfoDialog from "@/components/portfolio/EditProfileInfoDialog";
import EditSkillsDialog from "@/components/portfolio/EditSkillsDialog";
import EditContactDialog from "@/components/portfolio/EditContactDialog";
import EditExperienceDialog from "@/components/portfolio/EditExperienceDialog";
import EditEducationDialog from "@/components/portfolio/EditEducationDialog";

interface ProfileFull extends ProfileContacts {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  profession: string | null;
  is_public: boolean;
}

const messageSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(150),
  body: z.string().trim().min(1, "Message is required").max(2000),
});

const formatViews = (n: number) => {
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
};

const Portfolio = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [skills, setSkills] = useState<SkillRow[]>([]);
  const [items, setItems] = useState<PortfolioItemData[]>([]);
  const [experiences, setExperiences] = useState<ExperienceRow[]>([]);
  const [educations, setEducations] = useState<EducationRow[]>([]);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [openItem, setOpenItem] = useState<PortfolioItemData | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [bioExpanded, setBioExpanded] = useState(false);

  // Edit dialogs
  const [editProfile, setEditProfile] = useState(false);
  const [editSkills, setEditSkills] = useState(false);
  const [editContact, setEditContact] = useState(false);
  const [editExp, setEditExp] = useState(false);
  const [editEdu, setEditEdu] = useState(false);

  const [msg, setMsg] = useState({ subject: "", body: "" });
  const [msgErrors, setMsgErrors] = useState<Partial<Record<keyof typeof msg, string>>>({});
  const [sending, setSending] = useState(false);

  const seoName = profile?.full_name || profile?.username || username || "Portfolio";
  useSEO({
    title: profile ? `${seoName} — Portfolio on PortoBank` : "Portfolio — PortoBank",
    description:
      profile?.bio ||
      (profile?.profession
        ? `${seoName} — ${profile.profession} on PortoBank.`
        : "Discover this professional portfolio on PortoBank."),
    image: profile?.avatar_url || undefined,
    type: "profile",
  });

  const viewedRef = useRef(false);

  const loadAll = async () => {
    if (!username) return;
    const baseSelect =
      "id, user_id, username, full_name, bio, avatar_url, location, profession, is_public, email_contact, phone, website_url, linkedin_url, github_url, instagram_url, twitter_url, behance_url, dribbble_url";

    // Try by username first (without is_public filter so we can show "private" page)
    let { data: rows } = await supabase
      .from("profiles")
      .select(baseSelect)
      .eq("is_active", true)
      .eq("username", username)
      .limit(1);
    let profileRow = rows?.[0];

    if (!profileRow) {
      const { data: byId } = await supabase
        .from("profiles")
        .select(baseSelect)
        .eq("is_active", true)
        .eq("id", username)
        .limit(1);
      profileRow = byId?.[0];
    }

    if (!profileRow) {
      setNotFound(true);
      return;
    }

    if (!profileRow.is_public && profileRow.user_id !== user?.id) {
      setIsPrivate(true);
      setProfile(profileRow as ProfileFull);
      return;
    }

    setProfile(profileRow as ProfileFull);

    const [{ data: skillsData }, { data: portfoliosData }, { data: expData }, { data: eduData }] =
      await Promise.all([
        supabase.from("skills").select("name, category").eq("profile_id", profileRow.id),
        supabase
          .from("portfolios")
          .select("id, view_count")
          .eq("user_id", profileRow.user_id)
          .eq("is_published", true),
        supabase.from("experiences").select("*").eq("user_id", profileRow.user_id),
        supabase.from("educations").select("*").eq("user_id", profileRow.user_id),
      ]);

    setSkills((skillsData ?? []) as SkillRow[]);
    setExperiences((expData ?? []) as ExperienceRow[]);
    setEducations((eduData ?? []) as EducationRow[]);

    const portfolioIds = (portfoliosData ?? []).map((p) => p.id);
    const totalViews = (portfoliosData ?? []).reduce((sum, p: any) => sum + (p.view_count ?? 0), 0);
    setPortfolioId(portfolioIds[0] ?? null);
    setViewCount(totalViews);

    if (portfolioIds.length > 0) {
      const { data: itemsData } = await supabase
        .from("portfolio_items")
        .select("id, type, title, description, cover_url, external_link, tags, gallery_images")
        .in("portfolio_id", portfolioIds)
        .order("created_at", { ascending: false });
      setItems((itemsData as PortfolioItemData[]) ?? []);
    } else {
      setItems([]);
    }

    // Increment view count once per session for non-owner viewers
    if (
      !viewedRef.current &&
      profileRow.user_id !== user?.id &&
      portfolioIds.length > 0
    ) {
      viewedRef.current = true;
      const firstId = portfolioIds[0];
      const current = (portfoliosData ?? []).find((p: any) => p.id === firstId)?.view_count ?? 0;
      await supabase.from("portfolios").update({ view_count: current + 1 }).eq("id", firstId);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, user?.id]);

  const reloadExp = async () => {
    if (!profile) return;
    const { data } = await supabase.from("experiences").select("*").eq("user_id", profile.user_id);
    setExperiences((data ?? []) as ExperienceRow[]);
  };
  const reloadEdu = async () => {
    if (!profile) return;
    const { data } = await supabase.from("educations").select("*").eq("user_id", profile.user_id);
    setEducations((data ?? []) as EducationRow[]);
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Could not copy link.");
    }
  };

  const [downloadingCV, setDownloadingCV] = useState(false);
  const handleDownloadCV = async () => {
    if (!profile) return;
    setDownloadingCV(true);
    try {
      const data = await fetchCVDataByUserId(profile.user_id);
      if (!data) {
        toast.error("Could not load CV data");
        return;
      }
      await downloadCV(data);
      toast.success("CV downloaded");
    } catch (e) {
      console.error(e);
      toast.error("Could not generate CV");
    } finally {
      setDownloadingCV(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (user.id === profile.user_id) {
      toast.error("You cannot message yourself.");
      return;
    }
    const parsed = messageSchema.safeParse(msg);
    if (!parsed.success) {
      const newErrors: typeof msgErrors = {};
      parsed.error.errors.forEach((err) => {
        const k = err.path[0] as keyof typeof msg;
        newErrors[k] = err.message;
      });
      setMsgErrors(newErrors);
      return;
    }
    setMsgErrors({});
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: profile.user_id,
      subject: parsed.data.subject,
      body: parsed.data.body,
    });
    setSending(false);
    if (error) {
      toast.error("Could not send message.");
      return;
    }
    toast.success("Message sent!");
    setMsg({ subject: "", body: "" });
  };

  const isOwnProfile = useMemo(
    () => !!user && !!profile && user.id === profile.user_id,
    [user, profile]
  );

  if (notFound) {
    return (
      <Layout>
        <section className="container py-24 text-center max-w-md mx-auto">
          <h1 className="font-heading text-2xl font-bold">Profile not found</h1>
          <p className="text-muted-foreground mt-2">
            This profile doesn't exist.
          </p>
          <Button asChild className="mt-6">
            <Link to="/explore">Explore other talents</Link>
          </Button>
        </section>
      </Layout>
    );
  }

  if (isPrivate) {
    return (
      <Layout>
        <section className="container py-24 text-center max-w-md mx-auto">
          <div className="mx-auto h-16 w-16 rounded-full bg-secondary flex items-center justify-center">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
          <h1 className="font-heading text-2xl font-bold mt-4">This portfolio is private</h1>
          <p className="text-muted-foreground mt-2">
            The owner has set this profile to private.
          </p>
          <Button asChild className="mt-6">
            <Link to="/explore">Explore other talents</Link>
          </Button>
        </section>
      </Layout>
    );
  }

  if (!profile) {
    return (
      <Layout>
        <section className="container py-12">
          <div className="flex items-start gap-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-full max-w-2xl" />
            </div>
          </div>
        </section>
      </Layout>
    );
  }

  const displayName = seoName;
  const initials = displayName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const longBio = (profile.bio?.length ?? 0) > 220;

  const contacts: ProfileContacts = {
    email_contact: profile.email_contact,
    phone: profile.phone,
    website_url: profile.website_url,
    linkedin_url: profile.linkedin_url,
    github_url: profile.github_url,
    instagram_url: profile.instagram_url,
    twitter_url: profile.twitter_url,
    behance_url: profile.behance_url,
    dribbble_url: profile.dribbble_url,
  };

  return (
    <Layout>
      {/* Owner banner */}
      {isOwnProfile && (
        <div className="bg-primary/5 border-b border-primary/10">
          <div className="container py-2.5 flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-foreground/80">
              <span className="font-medium">This is your public profile.</span>{" "}
              <span className="text-muted-foreground">Visitors see exactly what's below.</span>
            </p>
            <Button size="sm" variant="outline" onClick={() => setEditProfile(true)}>
              <Pencil className="h-3.5 w-3.5 mr-1.5" /> Quick edit
            </Button>
          </div>
        </div>
      )}

      {/* HERO */}
      <section className="border-b bg-gradient-to-b from-secondary/40 to-background">
        <div className="container py-10 md:py-14">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8">
            <div className="shrink-0 flex md:block justify-center">
              <Avatar className="h-[120px] w-[120px] ring-4 ring-background shadow-elevated">
                {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
                <AvatarFallback className="text-3xl bg-primary/10 text-primary font-heading font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="font-heading text-3xl md:text-4xl font-bold leading-tight">
                    {displayName}
                  </h1>
                  {profile.username && (
                    <p className="text-muted-foreground text-sm mt-0.5">@{profile.username}</p>
                  )}
                  {profile.profession && (
                    <p className="text-primary font-medium mt-2">{profile.profession}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-muted-foreground">
                    {profile.location && (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {profile.location}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" /> {formatViews(viewCount)} views
                    </span>
                  </div>
                </div>
              </div>

              {profile.bio && (
                <div className="mt-4 max-w-3xl">
                  <p className={`text-foreground/80 ${!bioExpanded && longBio ? "line-clamp-3" : ""}`}>
                    {profile.bio}
                  </p>
                  {longBio && (
                    <button
                      type="button"
                      className="text-primary text-sm font-medium mt-1 hover:underline"
                      onClick={() => setBioExpanded((v) => !v)}
                    >
                      {bioExpanded ? "Show less" : "Show more"}
                    </button>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2 mt-5">
                <Button onClick={handleDownloadCV} disabled={downloadingCV}>
                  {downloadingCV ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-2" />
                  )}
                  Download CV
                </Button>
                {!isOwnProfile && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const el = document.getElementById("contact");
                      el?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    <Mail className="h-4 w-4 mr-2" /> Send Message
                  </Button>
                )}
                <LikeButton
                  ownerUserId={profile.user_id}
                  portfolioId={portfolioId ?? undefined}
                  size="default"
                  variant="outline"
                />
                <Button variant="outline" size="icon" onClick={handleShare} aria-label="Share profile">
                  <Share2 className="h-4 w-4" />
                </Button>
                {!isOwnProfile && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="More actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => {
                          if (!user) {
                            setShowLoginModal(true);
                            return;
                          }
                          setShowReportModal(true);
                        }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Flag className="h-4 w-4 mr-2" /> Report this profile
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                {isOwnProfile && (
                  <Button variant="ghost" size="sm" onClick={() => setEditProfile(true)}>
                    <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN GRID */}
      <section className="container py-10">
        <div className="grid gap-6 md:gap-8 md:grid-cols-10">
          {/* Sidebar */}
          <aside className="md:col-span-3 space-y-6 md:sticky md:top-20 md:self-start">
            <SkillsSidebar
              skills={skills}
              isOwner={isOwnProfile}
              onEdit={() => setEditSkills(true)}
            />
            <ContactSidebar
              contacts={contacts}
              isOwner={isOwnProfile}
              onEdit={() => setEditContact(true)}
            />
          </aside>

          {/* Main column */}
          <div className="md:col-span-7 space-y-6">
            <Card className="p-6 shadow-subtle" id="about">
              <h2 className="font-heading font-semibold text-lg mb-3">About Me</h2>
              <p className="text-foreground/80 whitespace-pre-wrap">
                {profile.bio || "This user hasn't added a description yet"}
              </p>
            </Card>

            <ExperienceSection
              experiences={experiences}
              isOwner={isOwnProfile}
              onEdit={() => setEditExp(true)}
            />

            <EducationSection
              educations={educations}
              isOwner={isOwnProfile}
              onEdit={() => setEditEdu(true)}
            />

            <ProjectsSection items={items} isOwner={isOwnProfile} onView={setOpenItem} />

            {/* Contact / message form */}
            <Card className="p-6 shadow-subtle" id="contact">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-4 w-4 text-primary" />
                <h2 className="font-heading font-semibold text-lg">Send a message</h2>
              </div>

              {!user ? (
                <div className="text-center py-6">
                  <p className="text-sm text-muted-foreground mb-4">
                    Login to send a message to {displayName}.
                  </p>
                  <Button onClick={() => navigate("/login")}>
                    <LogIn className="h-4 w-4 mr-2" /> Login to send a message
                  </Button>
                </div>
              ) : isOwnProfile ? (
                <p className="text-sm text-muted-foreground">This is your own profile.</p>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-4 max-w-xl">
                  <div>
                    <Label htmlFor="m-subject">Subject</Label>
                    <Input
                      id="m-subject"
                      value={msg.subject}
                      onChange={(e) => setMsg({ ...msg, subject: e.target.value })}
                      placeholder="Project collaboration"
                      className="mt-1.5"
                    />
                    {msgErrors.subject && (
                      <p className="text-xs text-destructive mt-1">{msgErrors.subject}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="m-body">Message</Label>
                    <Textarea
                      id="m-body"
                      rows={6}
                      value={msg.body}
                      onChange={(e) => setMsg({ ...msg, body: e.target.value })}
                      placeholder="Hi, I'd love to chat about..."
                      className="mt-1.5"
                    />
                    {msgErrors.body && (
                      <p className="text-xs text-destructive mt-1">{msgErrors.body}</p>
                    )}
                  </div>
                  <Button type="submit" disabled={sending}>
                    {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Send message
                  </Button>
                </form>
              )}
            </Card>
          </div>
        </div>
      </section>

      <ProjectModal item={openItem} onOpenChange={(o) => !o && setOpenItem(null)} />

      <LoginToActModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        title="Sign in required"
        description="Create a free account or sign in to interact with this portfolio."
      />

      <ReportProfileDialog
        open={showReportModal}
        onOpenChange={setShowReportModal}
        targetUserId={profile.user_id}
        onLoginRequired={() => setShowLoginModal(true)}
      />

      {/* Owner edit dialogs */}
      {isOwnProfile && (
        <>
          <EditProfileInfoDialog
            open={editProfile}
            onOpenChange={setEditProfile}
            userId={profile.user_id}
            initial={{
              full_name: profile.full_name ?? "",
              username: profile.username ?? "",
              bio: profile.bio ?? "",
              profession: profile.profession ?? "",
              location: profile.location ?? "",
              avatar_url: profile.avatar_url ?? "",
            }}
            onSaved={(u) => {
              setProfile((p) =>
                p
                  ? {
                      ...p,
                      full_name: u.full_name,
                      username: u.username || null,
                      bio: u.bio || null,
                      profession: u.profession || null,
                      location: u.location || null,
                      avatar_url: u.avatar_url || null,
                    }
                  : p
              );
              if (u.username && u.username !== profile.username) {
                navigate(`/${u.username}`, { replace: true });
              }
            }}
          />
          <EditSkillsDialog
            open={editSkills}
            onOpenChange={setEditSkills}
            profileId={profile.id}
            initial={skills}
            onSaved={setSkills}
          />
          <EditContactDialog
            open={editContact}
            onOpenChange={setEditContact}
            userId={profile.user_id}
            initial={contacts}
            onSaved={(c) => setProfile((p) => (p ? { ...p, ...c } : p))}
          />
          <EditExperienceDialog
            open={editExp}
            onOpenChange={setEditExp}
            userId={profile.user_id}
            experiences={experiences}
            onChanged={reloadExp}
          />
          <EditEducationDialog
            open={editEdu}
            onOpenChange={setEditEdu}
            userId={profile.user_id}
            educations={educations}
            onChanged={reloadEdu}
          />
        </>
      )}
    </Layout>
  );
};

export default Portfolio;
