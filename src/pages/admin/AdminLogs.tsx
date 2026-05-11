import { useEffect, useMemo, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ScrollText } from "lucide-react";
import EmptyState from "@/components/layout/EmptyState";
import { format } from "date-fns";

interface LogRow {
  id: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
  admin_id: string;
  admin_name?: string;
}

const AdminLogs = () => {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");

  useEffect(() => {
    document.title = "Audit Logs — PortoBank Admin";
    (async () => {
      const { data } = await supabase
        .from("admin_logs")
        .select("id, action, target_type, target_id, created_at, admin_id")
        .order("created_at", { ascending: false })
        .limit(500);
      const adminIds = Array.from(new Set((data ?? []).map((l) => l.admin_id)));
      const map = new Map<string, string>();
      if (adminIds.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name, username").in("user_id", adminIds);
        (profs ?? []).forEach((p) => map.set(p.user_id, p.full_name || p.username || "Admin"));
      }
      setRows((data ?? []).map((l) => ({ ...l, admin_name: map.get(l.admin_id) || "Admin" })));
      setLoading(false);
    })();
  }, []);

  const actionTypes = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.action));
    return Array.from(set).sort();
  }, [rows]);

  const filtered = rows.filter((r) => {
    const t = new Date(r.created_at).getTime();
    if (from && t < new Date(from).getTime()) return false;
    if (to && t > new Date(to).getTime() + 86399000) return false;
    if (actionFilter !== "all" && r.action !== actionFilter) return false;
    return true;
  });

  return (
    <AdminLayout title="Audit Logs">
      <Card>
        <CardContent className="p-4 md:p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">From</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">To</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Action</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All actions</SelectItem>
                  {actionTypes.map((a) => (
                    <SelectItem key={a} value={a}>{a}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={ScrollText}
              title={rows.length === 0 ? "No recent activity" : "No entries match your filters"}
              description={
                rows.length === 0
                  ? "Admin actions will appear here as they happen."
                  : "Try widening the date range or clearing the action filter."
              }
            />
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden md:block rounded-md border border-border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Admin</TableHead>
                      <TableHead>Action</TableHead>
                      <TableHead>Target type</TableHead>
                      <TableHead className="hidden lg:table-cell">Target ID</TableHead>
                      <TableHead>When</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm">{r.admin_name}</TableCell>
                        <TableCell className="text-sm font-medium">{r.action}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.target_type ?? "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono truncate max-w-[200px]">{r.target_id ?? "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                          {format(new Date(r.created_at), "MMM d, yyyy HH:mm")}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile card list */}
              <ul className="md:hidden space-y-2">
                {filtered.map((r) => (
                  <li key={r.id} className="border border-border rounded-md p-3 bg-card">
                    <p className="text-sm font-medium">{r.action}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {r.admin_name} · {r.target_type ?? "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(r.created_at), "MMM d, yyyy HH:mm")}
                    </p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminLogs;
