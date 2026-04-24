import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { logAdminAction } from "@/lib/admin-log";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { ExternalLink, MoreHorizontal, Loader2 } from "lucide-react";
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

const AdminPortfolios = () => {
  const { user } = useAdmin();
  const [rows, setRows] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"public" | "private" | "hidden">("public");

  const load = async () => {
    setLoading(true);
    const { data: portfolios } = await supabase
      .from("portfolios")
      .select("id, title, is_published, user_id, created_at")
      .order("created_at", { ascending: false });

    if (!portfolios) {
      setRows([]);
      setLoading(false);
      return;
    }

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
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    if (user) await logAdminAction(user.id, "Hid portfolio", "portfolio", row.id);
    toast({ title: "Portfolio hidden" });
    load();
  };

  const remove = async (row: PortfolioRow) => {
    const { error } = await supabase.from("portfolios").delete().eq("id", row.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    if (user) await logAdminAction(user.id, "Deleted portfolio", "portfolio", row.id);
    toast({ title: "Portfolio deleted" });
    load();
  };

  const filtered = rows.filter((r) => {
    if (filter === "public") return r.is_published;
    if (filter === "hidden") return !r.is_published;
    return true; // private == any (no extra signal in schema)
  });

  return (
    <AdminLayout title="Portfolios">
      <Card>
        <CardContent className="p-4 md:p-6 space-y-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <TabsList>
              <TabsTrigger value="public">Public</TabsTrigger>
              <TabsTrigger value="private">Private</TabsTrigger>
              <TabsTrigger value="hidden">Hidden</TabsTrigger>
            </TabsList>
          </Tabs>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="rounded-md border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Owner</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Visibility</TableHead>
                    <TableHead className="hidden md:table-cell">Items</TableHead>
                    <TableHead className="hidden md:table-cell">Likes</TableHead>
                    <TableHead className="hidden md:table-cell">Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-sm">{r.owner_name}</TableCell>
                      <TableCell className="font-medium text-sm">{r.title}</TableCell>
                      <TableCell>
                        <Badge variant={r.is_published ? "default" : "secondary"}>
                          {r.is_published ? "Public" : "Hidden"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{r.item_count}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm">{r.like_count}</TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {format(new Date(r.created_at), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {r.owner_username && (
                              <DropdownMenuItem asChild>
                                <a href={`/${r.owner_username}`} target="_blank" rel="noreferrer" className="flex items-center">
                                  <ExternalLink className="h-3.5 w-3.5 mr-2" /> View
                                </a>
                              </DropdownMenuItem>
                            )}
                            {r.is_published && (
                              <DropdownMenuItem onClick={() => hide(r)}>Hide</DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                  Delete
                                </DropdownMenuItem>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete portfolio?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This permanently removes "{r.title}" and all of its items.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => remove(r)}>Delete</AlertDialogAction>
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
                      <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-10">
                        No portfolios found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminPortfolios;
