import { useEffect, useMemo, useState } from "react";
import Layout from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import ProfileCard, { ProfileCardData } from "@/components/profiles/ProfileCard";
import { ProfileCardSkeleton } from "@/components/profiles/ProfileCardSkeleton";
import EmptyState from "@/components/layout/EmptyState";
import { useDebounce } from "@/hooks/useDebounce";
import { useSEO } from "@/hooks/useSEO";
import { Link } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

const PAGE_SIZE = 12;

const Explore = () => {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);
  const [profession, setProfession] = useState<string | null>(null);
  const [location, setLocation] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileCardData[] | null>(null);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);

  useSEO({
    title: "Explore Talents — PortoBank",
    description: "Discover portfolios from designers, developers, writers, and creators across every profession.",
  });

  // Reset page when filters change
  useEffect(() => {
    setPage(0);
  }, [debouncedQuery, profession, location]);

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
        .neq("role", "admin")
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (debouncedQuery.trim()) {
        const q = `%${debouncedQuery.trim()}%`;
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
    run();
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery, profession, location, page]);

  // Filter pill options (load distinct values)
  const [professions, setProfessions] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  useEffect(() => {
    const loadFilters = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("profession, location")
        .eq("is_public", true)
        .eq("is_active", true)
        .neq("role", "admin");
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

        <FilterBar
          professions={professions}
          locations={locations}
          profession={profession}
          location={location}
          setProfession={setProfession}
          setLocation={setLocation}
          onResetAll={() => {
            setQuery("");
            setProfession(null);
            setLocation(null);
          }}
          query={query}
          onClearQuery={() => setQuery("")}
        />
      </section>

      <section className="container pb-20">
        {/* spacer */}
      </section>

      <section className="container pb-20 -mt-20">{null}</section>

      <section className="container pb-20 -mt-20">{null}</section>
      </section>

      <section className="container pb-20">
        {profiles === null ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProfileCardSkeleton key={i} />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          <EmptyState
            icon={Search}
            title="No profiles found"
            description="Try adjusting your search or filters, or be the first to publish a portfolio in this area."
            action={
              hasFilters ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setProfession(null);
                    setLocation(null);
                  }}
                >
                  <X className="h-4 w-4 mr-2" /> Clear filters
                </Button>
              ) : (
                <Button asChild>
                  <Link to="/register">Create your portfolio</Link>
                </Button>
              )
            }
          />
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
