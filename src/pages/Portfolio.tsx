import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import Layout from "@/components/layout/Layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  ExternalLink,
  Loader2,
  Mail,
  MoreHorizontal,
  Flag,
  LogIn,
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

interface ProfileFull {
  id: string;
  user_id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  location: string | null;
  profession: string | null;
}

const messageSchema = z.object({
  subject: z.string().trim().min(1, "Subject is required").max(150),
  body: z.string().trim().min(1, "Message is required").max(2000),
});

const Portfolio = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [skills, setSkills] = useState<{ name: string; category: string | null }[]>([]);
  const [items, setItems] = useState<PortfolioItemData[]>([]);
  const [portfolioId, setPortfolioId] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<PortfolioItemData | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  const [msg, setMsg] = useState({ subject: "", body: "" });
  const [msgErrors, setMsgErrors] = useState<Partial<Record<keyof typeof msg, string>>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      const { data: byUsername } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, bio, avatar_url, location, profession")
        .eq("is_public", true)
        .eq("is_active", true)
        .eq("username", username)
        .limit(1);
      let profileRow = byUsername?.[0];

      if (!profileRow) {
        const { data: byId } = await supabase
          .from("profiles")
          .select("id, user_id, username, full_name, bio, avatar_url, location, profession")
          .eq("is_public", true)
          .eq("is_active", true)
          .eq("id", username)
          .limit(1);
        profileRow = byId?.[0];
      }

      if (!profileRow) {
        setNotFound(true);
        return;
      }
      setProfile(profileRow);

      const [{ data: skillsData }, { data: portfoliosData }] = await Promise.all([
        supabase.from("skills").select("name, category").eq("profile_id", profileRow.id),
        supabase
          .from("portfolios")
          .select("id")
          .eq("user_id", profileRow.user_id)
          .eq("is_published", true),
      ]);
      setSkills(skillsData ?? []);

      const portfolioIds = (portfoliosData ?? []).map((p) => p.id);
      setPortfolioId(portfolioIds[0] ?? null);

      if (portfolioIds.length > 0) {
        const { data: itemsData } = await supabase
          .from("portfolio_items")
          .select("id, type, title, description, cover_url, external_link, tags")
          .in("portfolio_id", portfolioIds)
          .order("created_at", { ascending: false });
        setItems((itemsData as PortfolioItemData[]) ?? []);
      }
    };
    load();
  }, [username]);

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

  if (notFound) {
    return (
      <Layout>
        <section className="container py-24 text-center max-w-md mx-auto">
          <h1 className="font-heading text-2xl font-bold">Profile not found</h1>
          <p className="text-muted-foreground mt-2">
            This profile doesn't exist or is private.
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

  const displayName = profile.full_name || profile.username || "Anonymous";
  const initials = displayName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase();
  const isOwnProfile = user?.id === profile.user_id;

  return (
    <Layout>
      <section className="container py-10 md:py-14">
        <Card className="p-6 md:p-8 shadow-subtle">
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-24 w-24 md:h-28 md:w-28">
              {profile.avatar_url && <AvatarImage src={profile.avatar_url} alt={displayName} />}
              <AvatarFallback className="text-2xl bg-primary/10 text-primary font-heading font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{displayName}</h1>
              {profile.profession && (
                <p className="text-primary font-medium mt-1">{profile.profession}</p>
              )}
              {profile.location && (
                <p className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3.5 w-3.5" /> {profile.location}
                </p>
              )}
              {profile.bio && (
                <p className="text-sm text-foreground/80 mt-3 max-w-3xl">{profile.bio}</p>
              )}
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {skills.slice(0, 8).map((s) => (
                    <Badge key={s.name} variant="secondary" className="font-normal">
                      {s.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex md:flex-col gap-2 flex-wrap items-start">
              <LikeButton
                ownerUserId={profile.user_id}
                portfolioId={portfolioId ?? undefined}
                size="sm"
                variant="outline"
              />
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadCV} disabled={downloadingCV}>
                {downloadingCV ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                CV
              </Button>
              {!isOwnProfile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="More actions">
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
            </div>
          </div>
        </Card>

        <Tabs defaultValue="about" className="mt-8">
          <TabsList>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="mt-6">
            <Card className="p-6 shadow-subtle">
              <h2 className="font-heading font-semibold mb-3">About</h2>
              <p className="text-foreground/80 whitespace-pre-wrap">
                {profile.bio || "No bio yet."}
              </p>
              {skills.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-heading font-semibold mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((s) => (
                      <Badge key={s.name} variant="secondary" className="font-normal">
                        {s.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="projects" className="mt-6">
            {items.length === 0 ? (
              <Card className="p-10 text-center shadow-subtle">
                <p className="text-muted-foreground">No projects published yet.</p>
              </Card>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setOpenItem(item)}
                    className="text-left"
                  >
                    <Card className="overflow-hidden shadow-subtle hover:shadow-elevated transition-shadow h-full flex flex-col">
                      <div className="aspect-video bg-secondary overflow-hidden">
                        {item.cover_url ? (
                          <img
                            src={item.cover_url}
                            alt={item.title}
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-muted-foreground text-sm">
                            No cover
                          </div>
                        )}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <h3 className="font-heading font-semibold">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {item.description}
                          </p>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {item.tags.slice(0, 3).map((t) => (
                              <Badge key={t} variant="secondary" className="text-xs font-normal">
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {item.external_link && (
                          <span className="inline-flex items-center text-xs text-primary mt-3">
                            <ExternalLink className="h-3 w-3 mr-1" /> External link
                          </span>
                        )}
                      </div>
                    </Card>
                  </button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contact" className="mt-6">
            <Card className="p-6 shadow-subtle max-w-xl">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="h-4 w-4 text-primary" />
                <h2 className="font-heading font-semibold">Send a message</h2>
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
                <p className="text-sm text-muted-foreground">
                  This is your own profile.
                </p>
              ) : (
                <form onSubmit={handleSendMessage} className="space-y-4">
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
          </TabsContent>
        </Tabs>
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
    </Layout>
  );
};

export default Portfolio;
