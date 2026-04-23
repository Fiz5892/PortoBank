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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  MapPin,
  Heart,
  Share2,
  Download,
  ExternalLink,
  Loader2,
  Mail,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import ProjectModal, { PortfolioItemData } from "@/components/portfolio/ProjectModal";
import { fetchCVDataByUserId } from "@/lib/cv-data";
import { downloadCV } from "@/lib/cv-pdf";

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

const contactSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: z.string().trim().email("Invalid email").max(255),
  message: z.string().trim().min(1, "Message is required").max(1000),
});

const Portfolio = () => {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileFull | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [skills, setSkills] = useState<{ name: string; category: string | null }[]>([]);
  const [items, setItems] = useState<PortfolioItemData[]>([]);
  const [likeCount, setLikeCount] = useState(0);
  const [hasLiked, setHasLiked] = useState(false);
  const [openItem, setOpenItem] = useState<PortfolioItemData | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const [contact, setContact] = useState({ name: "", email: "", message: "" });
  const [contactErrors, setContactErrors] = useState<Partial<Record<keyof typeof contact, string>>>({});
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!username) return;
    const load = async () => {
      // Try by username first, fallback to id (for users without a username yet)
      let q = supabase
        .from("profiles")
        .select("id, user_id, username, full_name, bio, avatar_url, location, profession")
        .eq("is_public", true)
        .eq("is_active", true)
        .limit(1);

      const { data: byUsername } = await q.eq("username", username);
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
      if (portfolioIds.length > 0) {
        const { data: itemsData } = await supabase
          .from("portfolio_items")
          .select("id, type, title, description, cover_url, external_link, tags")
          .in("portfolio_id", portfolioIds)
          .order("created_at", { ascending: false });
        setItems((itemsData as PortfolioItemData[]) ?? []);

        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .in("portfolio_id", portfolioIds);
        setLikeCount(count ?? 0);

        if (user) {
          const { data: myLike } = await supabase
            .from("likes")
            .select("id")
            .eq("user_id", user.id)
            .in("portfolio_id", portfolioIds)
            .limit(1);
          setHasLiked((myLike?.length ?? 0) > 0);
        }
      }
    };
    load();
  }, [username, user]);

  const handleLike = async () => {
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    if (!profile) return;
    const { data: portfoliosData } = await supabase
      .from("portfolios")
      .select("id")
      .eq("user_id", profile.user_id)
      .eq("is_published", true)
      .limit(1);
    const portfolioId = portfoliosData?.[0]?.id;
    if (!portfolioId) return;

    if (hasLiked) {
      await supabase.from("likes").delete().eq("user_id", user.id).eq("portfolio_id", portfolioId);
      setHasLiked(false);
      setLikeCount((c) => Math.max(0, c - 1));
    } else {
      const { error } = await supabase
        .from("likes")
        .insert({ user_id: user.id, portfolio_id: portfolioId });
      if (!error) {
        setHasLiked(true);
        setLikeCount((c) => c + 1);
      }
    }
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

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    if (!user) {
      setShowLoginModal(true);
      return;
    }
    const parsed = contactSchema.safeParse(contact);
    if (!parsed.success) {
      const newErrors: typeof contactErrors = {};
      parsed.error.errors.forEach((err) => {
        const k = err.path[0] as keyof typeof contact;
        newErrors[k] = err.message;
      });
      setContactErrors(newErrors);
      return;
    }
    setContactErrors({});
    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: profile.user_id,
      subject: `New message from ${parsed.data.name}`,
      body: `${parsed.data.message}\n\nReply to: ${parsed.data.email}`,
    });
    setSending(false);
    if (error) {
      toast.error("Could not send message.");
      return;
    }
    toast.success("Message sent!");
    setContact({ name: "", email: "", message: "" });
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

            <div className="flex md:flex-col gap-2 flex-wrap">
              <Button
                variant={hasLiked ? "default" : "outline"}
                size="sm"
                onClick={handleLike}
              >
                <Heart className={`h-4 w-4 mr-2 ${hasLiked ? "fill-current" : ""}`} />
                {likeCount}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-2" /> Share
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownloadCV}>
                <Download className="h-4 w-4 mr-2" /> CV
              </Button>
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
              <form onSubmit={handleContactSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="c-name">Name</Label>
                  <Input
                    id="c-name"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                    className="mt-1.5"
                  />
                  {contactErrors.name && (
                    <p className="text-xs text-destructive mt-1">{contactErrors.name}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="c-email">Email</Label>
                  <Input
                    id="c-email"
                    type="email"
                    value={contact.email}
                    onChange={(e) => setContact({ ...contact, email: e.target.value })}
                    className="mt-1.5"
                  />
                  {contactErrors.email && (
                    <p className="text-xs text-destructive mt-1">{contactErrors.email}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="c-message">Message</Label>
                  <Textarea
                    id="c-message"
                    rows={5}
                    value={contact.message}
                    onChange={(e) => setContact({ ...contact, message: e.target.value })}
                    className="mt-1.5"
                  />
                  {contactErrors.message && (
                    <p className="text-xs text-destructive mt-1">{contactErrors.message}</p>
                  )}
                </div>
                <Button type="submit" disabled={sending}>
                  {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Send message
                </Button>
                {!user && (
                  <p className="text-xs text-muted-foreground">
                    You'll need to sign in to send a message.
                  </p>
                )}
              </form>
            </Card>
          </TabsContent>
        </Tabs>
      </section>

      <ProjectModal item={openItem} onOpenChange={(o) => !o && setOpenItem(null)} />

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign in required</DialogTitle>
            <DialogDescription>
              Create a free account or sign in to interact with this portfolio.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button variant="outline" onClick={() => navigate("/login")}>
              Sign in
            </Button>
            <Button onClick={() => navigate("/register")}>Create account</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Portfolio;
