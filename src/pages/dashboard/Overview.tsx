import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Eye,
  Heart,
  MessageSquare,
  FolderOpen,
  Plus,
  UserCog,
  Share2,
  Copy,
} from "lucide-react";
import { toast } from "sonner";

interface Stats {
  views: number;
  likes: number;
  unread: number;
  items: number;
}

const Overview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ views: 0, likes: 0, unread: 0, items: 0 });
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, username")
        .eq("user_id", user.id)
        .maybeSingle();
      setSlug(profile?.username ?? profile?.id ?? null);

      const { data: portfolios } = await supabase
        .from("portfolios")
        .select("id, view_count")
        .eq("user_id", user.id);

      const portfolioIds = (portfolios ?? []).map((p) => p.id);
      const views = (portfolios ?? []).reduce((acc, p) => acc + (p.view_count ?? 0), 0);

      let likes = 0;
      let items = 0;
      if (portfolioIds.length > 0) {
        const [{ count: likeCount }, { count: itemCount }] = await Promise.all([
          supabase.from("likes").select("*", { count: "exact", head: true }).in("portfolio_id", portfolioIds),
          supabase.from("portfolio_items").select("*", { count: "exact", head: true }).in("portfolio_id", portfolioIds),
        ]);
        likes = likeCount ?? 0;
        items = itemCount ?? 0;
      }

      const { count: unread } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);

      setStats({ views, likes, unread: unread ?? 0, items });
    };
    load();
  }, [user]);

  const publicUrl = slug ? `${window.location.origin}/${slug}` : "";

  const copyUrl = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success("Public URL copied!");
    } catch {
      toast.error("Could not copy URL");
    }
  };

  const cards = [
    { label: "Total Views", value: stats.views, icon: Eye },
    { label: "Total Likes", value: stats.likes, icon: Heart },
    { label: "Unread Messages", value: stats.unread, icon: MessageSquare },
    { label: "Portfolio Items", value: stats.items, icon: FolderOpen },
  ];

  return (
    <DashboardLayout>
      <div className="max-w-6xl space-y-6">
        <div>
          <h1 className="font-heading text-2xl md:text-3xl font-bold">Overview</h1>
          <p className="text-muted-foreground mt-1">A snapshot of your portfolio activity.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Card key={c.label} className="p-5 shadow-subtle">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{c.label}</p>
                <c.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="font-heading text-3xl font-bold mt-2">{c.value}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6 shadow-subtle">
          <h2 className="font-heading font-semibold mb-4">Quick actions</h2>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/dashboard/portfolio">
                <Plus className="mr-2 h-4 w-4" /> Add Project
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/dashboard/profile">
                <UserCog className="mr-2 h-4 w-4" /> Edit Profile
              </Link>
            </Button>
            <Button variant="outline" onClick={copyUrl} disabled={!publicUrl}>
              <Share2 className="mr-2 h-4 w-4" /> Share Portfolio
            </Button>
          </div>
        </Card>

        {publicUrl && (
          <Card className="p-6 shadow-subtle">
            <h2 className="font-heading font-semibold mb-3">Your public link</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <code className="flex-1 px-3 py-2 rounded-md bg-secondary text-sm truncate">
                {publicUrl}
              </code>
              <Button variant="outline" onClick={copyUrl}>
                <Copy className="mr-2 h-4 w-4" /> Copy
              </Button>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Overview;
