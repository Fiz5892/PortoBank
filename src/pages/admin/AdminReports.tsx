import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { logAdminAction } from "@/lib/admin-log";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "@/hooks/use-toast";
import { Loader2, ExternalLink, Flag, ShieldCheck } from "lucide-react";
import EmptyState from "@/components/layout/EmptyState";
import { format } from "date-fns";

interface ReportRow {
  id: string;
  reason: string;
  status: string;
  created_at: string;
  reporter_id: string;
  target_user_id: string;
  reporter_name?: string;
  target_name?: string;
  target_username?: string | null;
}

const statusVariant = (s: string): "default" | "secondary" | "destructive" => {
  if (s === "resolved") return "default";
  if (s === "dismissed") return "secondary";
  return "destructive";
};

const AdminReports = () => {
  const { user } = useAdmin();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<ReportRow | null>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("reports")
      .select("id, reason, status, created_at, reporter_id, target_user_id")
      .order("created_at", { ascending: false });
    const ids = Array.from(new Set([...(data ?? []).flatMap((r) => [r.reporter_id, r.target_user_id])]));
    const profMap = new Map<string, { name: string; username: string | null }>();
    if (ids.length) {
      const { data: profs } = await supabase.from("profiles").select("user_id, full_name, username").in("user_id", ids);
      (profs ?? []).forEach((p) => profMap.set(p.user_id, { name: p.full_name || p.username || "User", username: p.username }));
    }
    setRows(
      (data ?? []).map((r) => ({
        ...r,
        reporter_name: profMap.get(r.reporter_id)?.name ?? "Unknown",
        target_name: profMap.get(r.target_user_id)?.name ?? "Unknown",
        target_username: profMap.get(r.target_user_id)?.username ?? null,
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Reports — PortoBank Admin";
    load();
  }, []);

  const updateStatus = async (row: ReportRow, status: "resolved" | "dismissed") => {
    const { error } = await supabase.from("reports").update({ status }).eq("id", row.id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    if (user) await logAdminAction(user.id, `Marked report ${status}`, "report", row.id);
    toast({ title: `Report ${status}` });
    setActive(null);
    load();
  };

  const suspendTarget = async (row: ReportRow) => {
    const { error } = await supabase.from("profiles").update({ is_active: false }).eq("user_id", row.target_user_id);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
      return;
    }
    if (user) {
      await logAdminAction(user.id, "Suspended user from report", "user", row.target_user_id);
      await supabase.from("reports").update({ status: "resolved" }).eq("id", row.id);
    }
    toast({ title: "User suspended & report resolved" });
    setActive(null);
    load();
  };

  return (
    <AdminLayout title="Reports">
      <Card>
        <CardContent className="p-4 md:p-6">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={ShieldCheck}
              title="No pending reports"
              description="All clear — there are no user reports to review right now."
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reporter</TableHead>
                      <TableHead>Target</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.id} className="cursor-pointer" onClick={() => setActive(r)}>
                        <TableCell className="text-sm">{r.reporter_name}</TableCell>
                        <TableCell className="text-sm font-medium">{r.target_name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground truncate max-w-xs">
                          {r.reason}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(r.created_at), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(r.status)} className="capitalize">{r.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card list */}
              <ul className="md:hidden space-y-3">
                {rows.map((r) => (
                  <li
                    key={r.id}
                    className="border border-border rounded-md p-4 bg-card cursor-pointer hover:bg-secondary/40 transition-colors"
                    onClick={() => setActive(r)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{r.target_name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Reported by {r.reporter_name}
                        </p>
                      </div>
                      <Badge variant={statusVariant(r.status)} className="capitalize shrink-0">{r.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{r.reason}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format(new Date(r.created_at), "MMM d, yyyy")}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Sheet open={!!active} onOpenChange={(open) => !open && setActive(null)}>
        <SheetContent className="w-full sm:max-w-md">
          {active && (
            <>
              <SheetHeader>
                <SheetTitle>Report details</SheetTitle>
                <SheetDescription>
                  Submitted {format(new Date(active.created_at), "MMM d, yyyy 'at' HH:mm")}
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-5">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reporter</p>
                  <p className="text-sm font-medium">{active.reporter_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Target user</p>
                  <p className="text-sm font-medium">{active.target_name}</p>
                  {active.target_username && (
                    <a
                      href={`/${active.target_username}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-xs text-primary mt-1 hover:underline"
                    >
                      View profile <ExternalLink className="ml-1 h-3 w-3" />
                    </a>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
                  <p className="text-sm whitespace-pre-wrap">{active.reason}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Status</p>
                  <Badge variant={statusVariant(active.status)} className="capitalize">{active.status}</Badge>
                </div>

                {active.status === "pending" && (
                  <div className="grid grid-cols-1 gap-2 pt-4 border-t border-border">
                    <Button onClick={() => updateStatus(active, "resolved")}>Mark Resolved</Button>
                    <Button variant="outline" onClick={() => updateStatus(active, "dismissed")}>Dismiss Report</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive">Suspend Reported User</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Suspend {active.target_name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will hide their profile from search and prevent them from logging in. The
                            report will also be marked as resolved. You can re-activate them later.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => suspendTarget(active)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Yes, suspend user
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
};

export default AdminReports;
