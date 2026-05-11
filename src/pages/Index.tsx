import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Sparkles,
  Rocket,
  Search as SearchIcon,
  Eye,
  Heart,
  FolderOpen,
  UserCog,
  Award,
  Briefcase,
  Plus,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProfileCard, { ProfileCardData } from "@/components/profiles/ProfileCard";
import { ProfileCardSkeleton } from "@/components/profiles/ProfileCardSkeleton";
import { useSEO } from "@/hooks/useSEO";
import { useAuth } from "@/hooks/useAuth";
import heroImage from "@/assets/hero-portobank.jpg";

/* ─────────────────────────── helpers ─────────────────────────── */

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

interface PersonalStats {
  portfolioViews: number;
  totalLikes: number;
  totalCertificates: number;
  totalProjects: number;
}

interface MyProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  profession: string | null;
}

interface RecommendedProject {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  external_link: string | null;
  tags: string[] | null;
  ownerName: string;
  ownerSlug: string;
  ownerProfession: string | null;
}

/* ─────────────────────────── main component ─────────────────────────── */

const Index = () => {
  const { user } = useAuth();
  const [featured, setFeatured] = useState<ProfileCardData[] | null>(null);
  const [recs, setRecs] = useState<ProfileCardData[] | null>(null);
  const [stats, setStats] = useState({ users: 0, portfolios: 0, professions: 0 });
  const [myProfile, setMyProfile] = useState<MyProfile | null>(null);
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null);
  const [recommendedProjects, setRecommendedProjects] = useState<RecommendedProject[]>([]);


  useSEO({
    title: "PortoBank — Your Portfolio, Your Identity",
    description:
      "Build a beautiful professional portfolio in minutes. Showcase your work, get discovered, and connect with opportunities — for every profession.",
  });

  /* ── global featured + stats ── */
  useEffect(() => {
    const load = async () => {
      const { data: pool } = await supabase.rpc("get_top_liked_profiles", { p_pool: 100 });
      const poolArr = (pool ?? []) as ProfileCardData[];
      const shuffled = [...poolArr].sort(() => Math.random() - 0.5).slice(0, 6);
      let withSkills: ProfileCardData[] = shuffled;
      if (shuffled.length > 0) {
        const ids = shuffled.map((p) => p.id);
        const { data: sk } = await supabase
          .from("skills")
          .select("profile_id, name")
          .in("profile_id", ids);
        const map = new Map<string, { name: string }[]>();
        (sk ?? []).forEach((s) => {
          const arr = map.get(s.profile_id) ?? [];
          arr.push({ name: s.name });
          map.set(s.profile_id, arr);
        });
        withSkills = shuffled.map((p) => ({ ...p, skills: map.get(p.id) ?? [] }));
      }
      setFeatured(withSkills);

      const [{ count: u }, { count: p }] = await Promise.all([
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_active", true)
          .neq("role", "admin"),
        supabase
          .from("portfolios")
          .select("*", { count: "exact", head: true })
          .eq("is_published", true),
      ]);
      const { data: profs } = await supabase
        .from("profiles")
        .select("profession")
        .neq("role", "admin")
        .not("profession", "is", null);
      const uniqueProfs = new Set(
        (profs ?? []).map((r) => r.profession).filter(Boolean)
      );
      setStats({ users: u ?? 0, portfolios: p ?? 0, professions: uniqueProfs.size });
    };
    load();
  }, []);

  /* ── personalized recs ── */
  useEffect(() => {
    if (!user) {
      setRecs(null);
      return;
    }
    const loadRecs = async () => {
      const { data: me } = await supabase
        .from("profiles")
        .select("id, profession")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!me) return;
      const { data: mySkills } = await supabase
        .from("skills")
        .select("name")
        .eq("profile_id", me.id);
      const skillNames = (mySkills ?? []).map((s) => s.name);

      let req = supabase
        .from("profiles")
        .select("id, user_id, username, full_name, profession, location, avatar_url, skills(name)")
        .eq("is_public", true)
        .eq("is_active", true)
        .neq("role", "admin")
        .neq("user_id", user.id)
        .limit(8);
      if (me.profession) req = req.eq("profession", me.profession);
      const { data } = await req;
      let result = (data as ProfileCardData[]) ?? [];

      if (skillNames.length > 0) {
        result = result
          .map((p) => {
            const overlap = (p.skills ?? []).filter((s) =>
              skillNames.some((n) => n.toLowerCase() === s.name.toLowerCase())
            ).length;
            return { p, overlap };
          })
          .sort((a, b) => b.overlap - a.overlap)
          .map((x) => x.p);
      }
      setRecs(result.slice(0, 6));
    };
    loadRecs();
  }, [user]);

  /* ── personal dashboard data ── */
  useEffect(() => {
    if (!user) {
      setMyProfile(null);
      setPersonalStats(null);
      setRecommendedProjects([]);
      return;
    }
    const loadDashboard = async () => {
      // My profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, full_name, username, avatar_url, profession")
        .eq("user_id", user.id)
        .maybeSingle();
      setMyProfile(profile ?? null);

      if (!profile) {
        setRecommendedProjects([]);
        return;
      }

      // My portfolios — pakai user_id sesuai Overview.tsx
      const { data: portfolios } = await supabase
        .from("portfolios")
        .select("id, view_count")
        .eq("user_id", user.id);

      const portfolioIds = (portfolios ?? []).map((p) => p.id);
      const totalViews = (portfolios ?? []).reduce(
        (sum, p) => sum + (p.view_count ?? 0),
        0
      );

      // Total likes — pakai tabel "likes" sesuai Overview.tsx
      let totalLikes = 0;
      if (portfolioIds.length > 0) {
        const { count } = await supabase
          .from("likes")
          .select("*", { count: "exact", head: true })
          .in("portfolio_id", portfolioIds);
        totalLikes = count ?? 0;
      }

      let totalCertificates = 0;
      let totalProjects = 0;
      if (portfolioIds.length > 0) {
        const [{ count: certCount }, { count: projectCount }] = await Promise.all([
          supabase
            .from("portfolio_items")
            .select("*", { count: "exact", head: true })
            .in("portfolio_id", portfolioIds)
            .eq("type", "certificate"),
          supabase
            .from("portfolio_items")
            .select("*", { count: "exact", head: true })
            .in("portfolio_id", portfolioIds)
            .eq("type", "project"),
        ]);
        totalCertificates = certCount ?? 0;
        totalProjects = projectCount ?? 0;
      }

      if (profile.profession) {
        const { data: similarProfiles } = await supabase
          .from("profiles")
          .select("id, user_id, username, full_name, profession")
          .eq("profession", profile.profession)
          .eq("is_public", true)
          .eq("is_active", true)
          .neq("user_id", user.id)
          .limit(30);

        const similarUserIds = (similarProfiles ?? []).map((p) => p.user_id);
        const { data: publicPortfolios } = similarUserIds.length > 0
          ? await supabase
              .from("portfolios")
              .select("id, user_id")
              .eq("is_published", true)
              .in("user_id", similarUserIds)
          : { data: [] };

        const publicPortfolioIds = (publicPortfolios ?? []).map((p) => p.id);
        if (publicPortfolioIds.length > 0) {
        const { data: projectRows } = await supabase
          .from("portfolio_items")
          .select("id, portfolio_id, title, description, cover_url, external_link, tags")
          .in("portfolio_id", publicPortfolioIds)
          .eq("type", "project")
          .limit(30);

        const ownerByPortfolio = new Map(
          (publicPortfolios ?? []).map((p) => [p.id, p.user_id])
        );
        const ownerByUser = new Map((similarProfiles ?? []).map((o) => [o.user_id, o]));
        const randomProjects = [...(projectRows ?? [])]
          .sort(() => Math.random() - 0.5)
          .slice(0, 5);

        setRecommendedProjects(
          randomProjects.map((project) => {
            const owner = ownerByUser.get(ownerByPortfolio.get(project.portfolio_id) ?? "");
            return {
              id: project.id,
              title: project.title,
              description: project.description,
              cover_url: project.cover_url,
              external_link: project.external_link,
              tags: project.tags,
              ownerName: owner?.full_name || owner?.username || "User PortoBank",
              ownerSlug: owner?.username || owner?.id || "explore",
              ownerProfession: owner?.profession ?? null,
            };
          })
        );
        } else {
          setRecommendedProjects([]);
        }
      } else {
        setRecommendedProjects([]);
      }

      setPersonalStats({ portfolioViews: totalViews, totalLikes, totalCertificates, totalProjects });
    };
    loadDashboard();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 11) return "Selamat pagi";
    if (h < 15) return "Selamat siang";
    if (h < 18) return "Selamat sore";
    return "Selamat malam";
  };

  /* ══════════════════════════════════════════════
     LOGGED-IN VIEW
  ══════════════════════════════════════════════ */
  if (user) {
    return (
      <Layout>
        {/* ── Dashboard Header ── */}
        <section className="bg-gradient-to-b from-secondary/60 to-background">
          <div className="container py-7 md:py-9">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
              <div className="flex items-center gap-4 min-w-0">
                {myProfile?.avatar_url ? (
                  <img
                    src={myProfile.avatar_url}
                    alt={myProfile.full_name ?? ""}
                    className="h-16 w-16 rounded-2xl object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl shrink-0">
                    {myProfile?.full_name?.[0] ?? user.email?.[0]?.toUpperCase() ?? "?"}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-muted-foreground">{greeting()},</p>
                  <h1 className="font-heading text-2xl md:text-3xl font-bold truncate">
                    {myProfile?.full_name ?? user.email?.split("@")[0] ?? "there"}
                  </h1>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                    {myProfile?.username && (
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-xs">
                        @{myProfile.username}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:shrink-0">
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/${myProfile?.username ?? myProfile?.id ?? "dashboard"}`}>
                    <FolderOpen className="h-4 w-4 mr-1.5" /> Lihat Portfolio
                  </Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/dashboard/profile">
                    <UserCog className="h-4 w-4 mr-1.5" /> Edit Profil
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {personalStats && (
          <section className="container pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {[
                {
                  icon: Eye,
                  label: "Total Views",
                  value: personalStats.portfolioViews,
                  color: "text-blue-500",
                  bg: "bg-blue-500/10",
                },
                {
                  icon: Heart,
                  label: "Total Likes",
                  value: personalStats.totalLikes,
                  color: "text-rose-500",
                  bg: "bg-rose-500/10",
                },
                {
                  icon: Award,
                  label: "Sertifikat",
                  value: personalStats.totalCertificates,
                  color: "text-amber-500",
                  bg: "bg-amber-500/10",
                },
                {
                  icon: Briefcase,
                  label: "Total Projects",
                  value: personalStats.totalProjects,
                  color: "text-emerald-500",
                  bg: "bg-emerald-500/10",
                },
              ].map((s) => (
                <div
                  key={s.label}
                  className="bg-card border border-border rounded-xl p-3.5 md:p-4 flex items-center gap-3 shadow-subtle hover:shadow-elevated transition-shadow"
                >
                  <div className={`h-9 w-9 rounded-lg ${s.bg} ${s.color} flex items-center justify-center shrink-0`}>
                    <s.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="font-heading text-xl md:text-2xl font-bold">{s.value.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground">{s.label}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}


        {/* ── Personalized Recommendations ── */}
        {recs && recs.length > 0 && (
          <section className="container pt-8 pb-4">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="font-heading text-xl md:text-2xl font-bold">
                  Direkomendasikan untuk Anda
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Berdasarkan profesi & skill Anda.
                </p>
              </div>
              <Link
                to="/explore"
                className="hidden sm:inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                Lihat semua <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recs.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>
          </section>
        )}

        {/* ── Personal Stats ── */}
        {recommendedProjects.length > 0 && (
          <section className="container pt-8">
            <div className="flex items-end justify-between mb-4">
              <div>
                <h2 className="font-heading text-xl md:text-2xl font-bold">
                  Rekomendasi Project
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Inspirasi terbaru dari portfolio yang sudah dipublish.
                </p>
              </div>
              <Link
                to="/explore"
                className="hidden sm:inline-flex items-center text-sm font-medium text-primary hover:underline"
              >
                Jelajahi profile <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </div>

            <div className="overflow-x-auto -mx-5 px-5 pb-2">
              <div className="flex gap-3 lg:grid lg:grid-cols-4 xl:grid-cols-5">
                {recommendedProjects.map((project) => (
                  <div
                    key={project.id}
                    className="min-w-[238px] lg:min-w-0 min-h-[320px] bg-card border border-border rounded-xl overflow-hidden shadow-subtle hover:shadow-elevated transition-shadow flex flex-col"
                  >
                    <Link
                      to={`/${project.ownerSlug}`}
                      className="aspect-[16/9] bg-secondary overflow-hidden"
                    >
                      {project.cover_url ? (
                        <img
                          src={project.cover_url}
                          alt={project.title}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center text-muted-foreground">
                          <Briefcase className="h-6 w-6" />
                        </div>
                      )}
                    </Link>

                    <div className="p-3.5 flex flex-col flex-1">
                      <div className="min-w-0">
                        <h3 className="font-heading font-semibold text-sm md:text-base leading-tight line-clamp-1">
                          {project.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          oleh {project.ownerName}
                          {project.ownerProfession ? ` - ${project.ownerProfession}` : ""}
                        </p>
                      </div>

                      {project.description && (
                        <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                          {project.description}
                        </p>
                      )}

                      {(project.tags ?? []).length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {(project.tags ?? []).slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md border border-border px-2 py-0.5 text-[11px] text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-2 mt-auto pt-3">
                        <Button asChild size="sm" className="h-8 flex-1 text-xs">
                          <Link to={`/${project.ownerSlug}`}>Lihat Portfolio</Link>
                        </Button>
                        {project.external_link && (
                          <Button asChild variant="outline" size="sm" className="h-8 w-8 px-0" aria-label="Buka link project">
                            <a href={project.external_link} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Featured Talents ── */}
        <section className="container py-10">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="font-heading text-xl md:text-2xl font-bold">Featured Talents</h2>
              <p className="text-muted-foreground text-sm mt-1">
                Profesional terbaik minggu ini.
              </p>
            </div>
            <Link
              to="/explore"
              className="hidden sm:inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Lihat semua <ArrowRight className="ml-1 h-4 w-4" />
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
                      Belum ada featured profile.
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

        {/* ── CTA untuk user belum punya portfolio ── */}
        {personalStats?.totalCertificates === 0 && personalStats?.portfolioViews === 0 && (
          <section className="container pb-16">
            <div className="rounded-2xl bg-primary text-primary-foreground p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-6">
              <div>
                <h2 className="font-heading text-xl md:text-3xl font-bold">
                  Belum punya portfolio publik?
                </h2>
                <p className="mt-2 text-primary-foreground/80 text-sm md:text-base max-w-md">
                  Buat portfolio pertamamu sekarang dan mulai ditemukan oleh klien & rekruter.
                </p>
              </div>
              <Button size="lg" variant="secondary" className="shrink-0" asChild>
                <Link to="/dashboard/portfolio/new">
                  <Plus className="h-4 w-4 mr-2" /> Buat Portfolio
                </Link>
              </Button>
            </div>
          </section>
        )}
      </Layout>
    );
  }

  /* ══════════════════════════════════════════════
     LOGGED-OUT / GUEST VIEW  (landing page)
  ══════════════════════════════════════════════ */
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
            <p className="text-muted-foreground mt-2">
              Discover professionals doing remarkable work.
            </p>
          </div>
          <Link
            to="/explore"
            className="hidden sm:inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
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
            <p className="text-muted-foreground mt-2">
              Three steps to a portfolio that gets you noticed.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: Sparkles,
                title: "Create",
                desc: "Add your bio, skills, and projects in a clean, guided editor.",
              },
              {
                icon: Rocket,
                title: "Publish",
                desc: "Get a personal URL and a polished public portfolio in seconds.",
              },
              {
                icon: SearchIcon,
                title: "Get discovered",
                desc: "Be found by clients and recruiters through Explore.",
              },
            ].map((step, i) => (
              <div
                key={step.title}
                className="bg-card border border-border rounded-lg p-6 shadow-subtle"
              >
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
