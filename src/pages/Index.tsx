import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Rocket, Search as SearchIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProfileCard, { ProfileCardData } from "@/components/profiles/ProfileCard";
import { ProfileCardSkeleton } from "@/components/profiles/ProfileCardSkeleton";
import { useSEO } from "@/hooks/useSEO";
import heroImage from "@/assets/hero-portobank.jpg";

const useCounter = (target: number, duration = 1500) => {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setValue(Math.floor(progress * target));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

const StatItem = ({ value, label }: { value: number; label: string }) => {
  const animated = useCounter(value);
  return (
    <div className="text-center">
      <div className="font-heading text-3xl md:text-4xl font-bold text-primary">
        {animated.toLocaleString()}
      </div>
      <div className="text-sm text-muted-foreground mt-1">{label}</div>
    </div>
  );
};

const Index = () => {
  const [featured, setFeatured] = useState<ProfileCardData[] | null>(null);
  const [stats, setStats] = useState({ users: 0, portfolios: 0, professions: 0 });

  useSEO({
    title: "PortoBank — Your Portfolio, Your Identity",
    description:
      "Build a beautiful professional portfolio in minutes. Showcase your work, get discovered, and connect with opportunities — for every profession.",
  });

  useEffect(() => {
    const load = async () => {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_id, username, full_name, profession, location, avatar_url, skills(name)")
        .eq("is_public", true)
        .eq("is_active", true)
        .neq("role", "admin")
        .order("created_at", { ascending: false })
        .limit(6);
      setFeatured((profiles as ProfileCardData[]) ?? []);

      const [{ count: u }, { count: p }] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }).eq("is_active", true).neq("role", "admin"),
        supabase.from("portfolios").select("*", { count: "exact", head: true }).eq("is_published", true),
      ]);

      const { data: profs } = await supabase
        .from("profiles")
        .select("profession")
        .neq("role", "admin")
        .not("profession", "is", null);
      const uniqueProfs = new Set((profs ?? []).map((r) => r.profession).filter(Boolean));

      setStats({
        users: u ?? 0,
        portfolios: p ?? 0,
        professions: uniqueProfs.size,
      });
    };
    load();
  }, []);

  return (
    <Layout>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 opacity-60"
          style={{
            backgroundImage: `url(${heroImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="container py-20 md:py-32">
          <div className="max-w-3xl animate-fade-in">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-full bg-secondary text-primary mb-6">
              <Sparkles className="h-3 w-3" /> For every profession
            </span>
            <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">
              Your Portfolio,{" "}
              <span className="text-primary">Your Identity.</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl">
              Build a beautiful professional portfolio in minutes. Showcase your work, get
              discovered, and connect with opportunities — whatever your profession.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Button size="lg" asChild>
                <Link to="/explore">
                  Explore Talents <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/register">Get Started Free</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURED PROFILES */}
      <section className="container py-16 md:py-24">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold">Featured talents</h2>
            <p className="text-muted-foreground mt-2">Discover professionals doing remarkable work.</p>
          </div>
          <Link to="/explore" className="hidden sm:inline-flex items-center text-sm font-medium text-primary hover:underline">
            See all <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>

        <div className="overflow-x-auto -mx-5 px-5 pb-2">
          <div className="flex gap-4 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-5">
            {featured === null
              ? Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="min-w-[280px] md:min-w-0">
                    <ProfileCardSkeleton />
                  </div>
                ))
              : featured.length === 0
                ? (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    No featured profiles yet — be the first!
                  </div>
                )
                : featured.map((p) => (
                    <div key={p.id} className="min-w-[280px] md:min-w-0">
                      <ProfileCard profile={p} />
                    </div>
                  ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-secondary/40 border-y border-border">
        <div className="container py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="font-heading text-2xl md:text-3xl font-bold">How it works</h2>
            <p className="text-muted-foreground mt-2">Three steps to a portfolio that gets you noticed.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: "Create", desc: "Add your bio, skills, and projects in a clean, guided editor." },
              { icon: Rocket, title: "Publish", desc: "Get a personal URL and a polished public portfolio in seconds." },
              { icon: SearchIcon, title: "Get discovered", desc: "Be found by clients and recruiters through Explore." },
            ].map((step, i) => (
              <div key={step.title} className="bg-card border border-border rounded-lg p-6 shadow-subtle">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-10 w-10 rounded-md bg-primary/10 text-primary flex items-center justify-center">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold text-muted-foreground">STEP {i + 1}</span>
                </div>
                <h3 className="font-heading font-semibold text-lg">{step.title}</h3>
                <p className="text-sm text-muted-foreground mt-2">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="container py-16 md:py-20">
        <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
          <StatItem value={stats.users} label="Total users" />
          <StatItem value={stats.portfolios} label="Portfolios" />
          <StatItem value={stats.professions} label="Professions" />
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="container pb-20 md:pb-28">
        <div className="rounded-2xl bg-primary text-primary-foreground p-10 md:p-14 text-center shadow-elevated">
          <h2 className="font-heading text-2xl md:text-4xl font-bold">
            Ready to share your work?
          </h2>
          <p className="mt-3 text-primary-foreground/80 max-w-xl mx-auto">
            Join thousands of professionals building beautiful portfolios on PortoBank.
          </p>
          <Button size="lg" variant="secondary" className="mt-6" asChild>
            <Link to="/register">Create Free Account</Link>
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Index;
