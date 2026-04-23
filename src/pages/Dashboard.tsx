import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ExternalLink, Settings } from "lucide-react";

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  profession: string | null;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState({ portfolios: 0, items: 0, skills: 0 });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    const load = async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, username, full_name, profession")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(p);

      const [{ count: portfolios }, { count: skills }] = await Promise.all([
        supabase.from("portfolios").select("*", { count: "exact", head: true }).eq("user_id", user.id),
        p ? supabase.from("skills").select("*", { count: "exact", head: true }).eq("profile_id", p.id) : Promise.resolve({ count: 0 } as { count: number }),
      ]);

      const { data: pIds } = await supabase.from("portfolios").select("id").eq("user_id", user.id);
      const ids = (pIds ?? []).map((r) => r.id);
      let itemsCount = 0;
      if (ids.length > 0) {
        const { count } = await supabase
          .from("portfolio_items")
          .select("*", { count: "exact", head: true })
          .in("portfolio_id", ids);
        itemsCount = count ?? 0;
      }

      setStats({ portfolios: portfolios ?? 0, items: itemsCount, skills: skills ?? 0 });
    };
    load();
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <Layout>
        <section className="container py-20 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </section>
      </Layout>
    );
  }

  const slug = profile?.username ?? profile?.id;

  return (
    <Layout>
      <section className="container py-10 md:py-14">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl md:text-4xl font-bold">
              Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-muted-foreground mt-1">Here's a quick look at your PortoBank.</p>
          </div>
          <div className="flex gap-2">
            {slug && (
              <Button variant="outline" asChild>
                <Link to={`/${slug}`}>
                  <ExternalLink className="mr-2 h-4 w-4" /> View public profile
                </Link>
              </Button>
            )}
            <Button asChild>
              <Link to="/onboarding">
                <Settings className="mr-2 h-4 w-4" /> Edit profile
              </Link>
            </Button>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 mt-8">
          {[
            { label: "Portfolios", value: stats.portfolios },
            { label: "Projects & items", value: stats.items },
            { label: "Skills", value: stats.skills },
          ].map((s) => (
            <Card key={s.label} className="p-6 shadow-subtle">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="font-heading text-3xl font-bold mt-1">{s.value}</p>
            </Card>
          ))}
        </div>

        <Card className="p-6 mt-6 shadow-subtle">
          <h2 className="font-heading font-semibold">Up next</h2>
          <p className="text-sm text-muted-foreground mt-1">
            The full editor and message inbox are coming soon. For now you can preview your public profile and revisit
            the onboarding wizard to update your details.
          </p>
        </Card>
      </section>
    </Layout>
  );
};

export default Dashboard;
