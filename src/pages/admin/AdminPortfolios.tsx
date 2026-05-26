import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { logAdminAction } from "@/lib/admin-log";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { ExternalLink, MoreHorizontal, Loader2, Globe, EyeOff, LayoutGrid, Heart, Image, CalendarDays } from "lucide-react";
import { format } from "date-fns";

interface PortfolioRow {
  id: string;
  title: string;
  is_published: boolean;
  user_id: string;
  created_at: string;
  owner_name?: string;
  owner_username?: string | null;
  item_count?: number;
  like_count?: number;
}

type FilterType = "all" | "public" | "hidden";

const FILTERS: { value: FilterType; label: string; icon: React.ReactNode }[] = [
  { value: "all", label: "All", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { value: "public", label: "Public", icon: <Globe className="h-3.5 w-3.5" /> },
  { value: "hidden", label: "Hidden", icon: <EyeOff className="h-3.5 w-3.5" /> },
];

function getInitials(name?: string) {
  if (!name || name === "—") return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "bg-violet-100 text-violet-700",
  "bg-sky-100 text-sky-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
];

function avatarColor(name?: string) {
  if (!name) return AVATAR_COLORS[0];
  const code = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[code];
}

const AdminPortfolios = () => {
  const { user } = useAdmin();
  const [rows, setRows] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");

  const load = async () => {
    setLoading(true);
    const { data: portfolios } = await supabase
      .from("portfolios")
      .select("id, title, is_published, user_id, created_at")
      .order("created_at", { ascending: false });

    if (!portfolios) { setRows([]); setLoading(false); return; }

    const ids = portfolios.map((p) => p.id);
    const userIds = Array.from(new Set(portfolios.map((p) => p.user_id)));

    const [profilesRes, itemsRes, likesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name, username, is_public").in("user_id", userIds),
      ids.length ? supabase.from("portfolio_items").select("portfolio_id").in("portfolio_id", ids) : Promise.resolve({ data: [] as { portfolio_id: string }[] }),
      ids.length ? supabase.from("likes").select("portfolio_id").in("portfolio_id", ids) : Promise.resolve({ data: [] as { portfolio_id: string }[] }),
    ]);

    const profMap = new Map((profilesRes.data ?? []).map((p) => [p.user_id, p]));
    const itemCounts = new Map<string, number>();
    (itemsRes.data ?? []).forEach((i) => itemCounts.set(i.portfolio_id, (itemCounts.get(i.portfolio_id) ?? 0) + 1));
    const likeCounts = new Map<string, number>();
    (likesRes.data ?? []).forEach((l) => likeCounts.set(l.portfolio_id, (likeCounts.get(l.portfolio_id) ?? 0) + 1));

    setRows(
      portfolios.map((p) => {
        const prof = profMap.get(p.user_id);
        return {
          ...p,
          owner_name: prof?.full_name || "—",
          owner_username: prof?.username ?? null,
          item_count: itemCounts.get(p.id) ?? 0,
          like_count: likeCounts.get(p.id) ?? 0,
        };
      }),
    );
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Manage Portfolios — PortoBank Admin";
    load();
  }, []);

  const hide = async (row: PortfolioRow) => {
    const { error } = await supabase.from("portfolios").update({ is_published: false }).eq("id", row.id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    if (user) await logAdminAction(user.id, "Hid portfolio", "portfolio", row.id);
    toast({ title: "Portfolio hidden" });
    load();
  };

  const remove = async (row: PortfolioRow) => {
    const { error } = await supabase.from("portfolios").delete().eq("id", row.id);
    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); return; }
    if (user) await logAdminAction(user.id, "Deleted portfolio", "portfolio", row.id);
    toast({ title: "Portfolio deleted" });
    load();
  };

  const totalPublic = rows.filter((r) => r.is_published).length;
  const totalHidden = rows.filter((r) => !r.is_published).length;
  const totalItems = rows.reduce((sum, r) => sum + (r.item_count ?? 0), 0);
  const totalLikes = rows.reduce((sum, r) => sum + (r.like_count ?? 0), 0);

  const filtered = rows.filter((r) => {
    if (filter === "public") return r.is_published;
    if (filter === "hidden") return !r.is_published;
    return true;
  });

  return (
    <AdminLayout title="Portfolios">
      <div className="space-y-6">

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard
            label="Total Portfolios"
            value={rows.length}
            icon={<LayoutGrid className="h-4 w-4" />}
            colorClass="bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400"
            loading={loading}
          />
          <StatCard
            label="Public"
            value={totalPublic}
            icon={<Globe className="h-4 w-4" />}
            colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
            loading={loading}
          />
          <StatCard
            label="Total Items"
            value={totalItems}
            icon={<Image className="h-4 w-4" />}
            colorClass="bg-sky-50 text-sky-600 dark:bg-sky-950/40 dark:text-sky-400"
            loading={loading}
          />
          <StatCard
            label="Total Likes"
            value={totalLikes}
            icon={<Heart className="h-4 w-4" />}
            colorClass="bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
            loading={loading}
          />
        </div>

        {/* ── Table Card ── */}
        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-0">

            {/* Filter bar */}
            <div className="flex items-center gap-1 px-4 pt-4 pb-3 border-b border-border/60">
              {FILTERS.map((f) => {
                const count =
                  f.value === "all" ? rows.length :
                  f.value === "public" ? totalPublic : totalHidden;
                const active = filter === f.value;
                return (
                  <button
                    key={f.value}
                    onClick={() => setFilter(f.value)}
                    className={`
                      inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all
                      ${active
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"}
                    `}
                  >
                    {f.icon}
                    {f.label}
                    <span className={`
                      text-xs px-1.5 py-0.5 rounded-full font-semibold
                      ${active ? "bg-background/20 text-background" : "bg-muted text-muted-foreground"}
                    `}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Table */}
            {loading ? (
              <div className="py-20 flex flex-col items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Loading portfolios…</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30">
                      <TableHead className="pl-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Owner</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Title</TableHead>
                      <TableHead className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Status</TableHead>
                      <TableHead className="hidden md:table-cell text-xs uppercase tracking-wider font-semibold text-muted-foreground">Items</TableHead>
                      <TableHead className="hidden md:table-cell text-xs uppercase tracking-wider font-semibold text-muted-foreground">Likes</TableHead>
                      <TableHead className="hidden md:table-cell text-xs uppercase tracking-wider font-semibold text-muted-foreground">Created</TableHead>
                      <TableHead className="text-right pr-4 text-xs uppercase tracking-wider font-semibold text-muted-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow
                        key={r.id}
                        className="group hover:bg-muted/30 transition-colors border-border/40"
                      >
                        {/* Owner */}
                        <TableCell className="pl-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`
                              h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0
                              ${avatarColor(r.owner_name)}
                            `}>
                              {getInitials(r.owner_name)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium truncate leading-tight">{r.owner_name}</p>
                              {r.owner_username && (
                                <p className="text-xs text-muted-foreground truncate">@{r.owner_username}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        {/* Title */}
                        <TableCell className="py-3">
                          <span className="text-sm font-medium">{r.title}</span>
                        </TableCell>

                        {/* Status badge */}
                        <TableCell className="py-3">
                          {r.is_published ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block" />
                              Public
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-zinc-400 inline-block" />
                              Hidden
                            </span>
                          )}
                        </TableCell>

                        {/* Items */}
                        <TableCell className="hidden md:table-cell py-3">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Image className="h-3.5 w-3.5" />
                            <span>{r.item_count}</span>
                          </div>
                        </TableCell>

                        {/* Likes */}
                        <TableCell className="hidden md:table-cell py-3">
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                            <Heart className="h-3.5 w-3.5" />
                            <span>{r.like_count}</span>
                          </div>
                        </TableCell>

                        {/* Created */}
                        <TableCell className="hidden md:table-cell py-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <CalendarDays className="h-3.5 w-3.5" />
                            {format(new Date(r.created_at), "MMM d, yyyy")}
                          </div>
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="text-right pr-4 py-3">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {r.owner_username && (
                                <DropdownMenuItem asChild>
                                  <a
                                    href={`/${r.owner_username}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                    View portfolio
                                  </a>
                                </DropdownMenuItem>
                              )}
                              {r.is_published && (
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="gap-2">
                                      <EyeOff className="h-3.5 w-3.5" />
                                      Hide portfolio
                                    </DropdownMenuItem>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Hide this portfolio?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        <strong>"{r.title}"</strong> will be removed from public discovery. The owner can republish it later.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => hide(r)}>Hide</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              )}
                              <DropdownMenuSeparator />
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive gap-2 focus:text-destructive"
                                  >
                                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                                    Delete permanently
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete portfolio?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This permanently removes <strong>"{r.title}"</strong> and all of its items. This cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => remove(r)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}

                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="py-20 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <LayoutGrid className="h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">No portfolios found.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Footer count */}
            {!loading && filtered.length > 0 && (
              <div className="px-4 py-3 border-t border-border/40 text-xs text-muted-foreground">
                Showing <span className="font-medium text-foreground">{filtered.length}</span> of{" "}
                <span className="font-medium text-foreground">{rows.length}</span> portfolios
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

/* ── Stat card helper component ── */
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  loading: boolean;
}

const StatCard = ({ label, value, icon, colorClass, loading }: StatCardProps) => (
  <Card className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
    <CardContent className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">{label}</p>
          {loading ? (
            <div className="h-7 w-12 rounded bg-muted animate-pulse" />
          ) : (
            <p className="text-2xl font-bold tracking-tight">{value.toLocaleString()}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${colorClass}`}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);

export default AdminPortfolios;