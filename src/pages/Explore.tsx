import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProfileCard, { ProfileCardData } from "@/components/profiles/ProfileCard";
import { ProfileCardSkeleton } from "@/components/profiles/ProfileCardSkeleton";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const Explore = () => {
  const [query, setQuery] = useState("");
  const [profession, setProfession] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileCardData[] | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [query, profession, location]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setProfiles(null);
      let req = supabase
        .from("profiles")
        .select("id, user_id, username, full_name, profession, location, avatar_url, skills(name)", {
          count: "exact",
        })
        .eq("is_public", true)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (query.trim()) {
        const q = `%${query.trim()}%`;
        req = req.or(`full_name.ilike.${q},username.ilike.${q},profession.ilike.${q}`);
      }
      if (profession) req = req.eq("profession", profession);
      if (location) req = req.eq("location", location);

      const { data, count, error } = await req;
      if (cancelled) return;
      if (error) {
        setProfiles([]);
        return;
      }
      setProfiles((data as ProfileCardData[]) ?? []);
      setTotal(count ?? 0);
    };
    const t = setTimeout(run, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [query, profession, location, page]);

  // Filter pill options (load distinct values)
  const [professions, setProfessions] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  useEffect(() => {
    const loadFilters = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("profession, location")
        .eq("is_public", true)
        .eq("is_active", true);
      const profs = new Set<string>();
      const locs = new Set<string>();
      (data ?? []).forEach((r) => {
        if (r.profession) profs.add(r.profession);
        if (r.location) locs.add(r.location);
      });
      setProfessions(Array.from(profs).slice(0, 12));
      setLocations(Array.from(locs).slice(0, 8));
    };
    loadFilters();
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hasFilters = useMemo(() => query || profession || location, [query, profession, location]);

  return (
    <Layout>
      <section className="container py-12 md:py-16">
        <div className="max-w-3xl">
          <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight">Explore talents</h1>
          <p className="text-muted-foreground mt-2">
            Discover portfolios from professionals across every field.
          </p>
        </div>

        <div className="mt-8 relative max-w-2xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, profession, or skill..."
            className="pl-10 h-12"
          />
        </div>

        {/* Filter pills */}
        {(professions.length > 0 || locations.length > 0) && (
          <div className="mt-6 space-y-3">
            {professions.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Profession:</span>
                {professions.map((p) => (
                  <button
                    key={p}
                    onClick={() => setProfession(profession === p ? null : p)}
                    className={cn(
                      "px-3 py-1 text-xs rounded-full border transition-colors",
                      profession === p
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/50",
                    )}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
            {locations.length > 0 && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-semibold text-muted-foreground mr-1">Location:</span>
                {locations.map((l) => (
                  <button
                    key={l}
                    onClick={() => setLocation(location === l ? null : l)}
                    className={cn(
                      "px-3 py-1 text-xs rounded-full border transition-colors",
                      location === l
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border hover:border-primary/50",
                    )}
                  >
                    {l}
                  </button>
                ))}
              </div>
            )}
            {hasFilters && (
              <button
                onClick={() => {
                  setQuery("");
                  setProfession(null);
                  setLocation(null);
                }}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              >
                <X className="h-3 w-3" /> Clear filters
              </button>
            )}
          </div>
        )}
      </section>

      <section className="container pb-20">
        {profiles === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="h-20 w-20 mx-auto rounded-full bg-secondary flex items-center justify-center mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-heading text-lg font-semibold">No profiles found</h3>
            <p className="text-muted-foreground text-sm mt-2">
              Try adjusting your search or filters to find more talents.
            </p>
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {profiles.map((p) => (
                <ProfileCard key={p.id} profile={p} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-10">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground px-2">
                  Page {page + 1} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </Layout>
  );
};

export default Explore;
