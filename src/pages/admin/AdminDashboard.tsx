import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Flag, Eye, Loader2 } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { format, subDays, startOfDay } from "date-fns";

interface Kpis {
  users: number;
  portfolios: number;
  reports: number;
  views: number;
}

interface LogRow {
  id: string;
  action: string;
  target_type: string | null;
  created_at: string;
  admin_id: string;
  admin_name?: string;
}

const AdminDashboard = () => {
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [series, setSeries] = useState<{ date: string; count: number }[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Admin Dashboard — PortoBank";
    (async () => {
      const since = startOfDay(subDays(new Date(), 29)).toISOString();

      const [usersRes, portfoliosRes, reportsRes, viewsRes, signupsRes, logsRes] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase.from("portfolios").select("*", { count: "exact", head: true }).eq("is_published", true),
        supabase.from("reports").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("portfolios").select("view_count"),
        supabase.from("profiles").select("created_at").gte("created_at", since),
        supabase.from("admin_logs").select("id, action, target_type, created_at, admin_id").order("created_at", { ascending: false }).limit(10),
      ]);

      const totalViews = (viewsRes.data ?? []).reduce((s, r) => s + (r.view_count ?? 0), 0);

      // Build 30-day series
      const days: { date: string; count: number }[] = [];
      for (let i = 29; i >= 0; i--) {
        const d = startOfDay(subDays(new Date(), i));
        days.push({ date: format(d, "MMM d"), count: 0 });
      }
      (signupsRes.data ?? []).forEach((p) => {
        const idx = 29 - Math.floor((Date.now() - new Date(p.created_at).getTime()) / 86400000);
        if (idx >= 0 && idx < 30) days[idx].count += 1;
      });

      // Resolve admin names
      const adminIds = Array.from(new Set((logsRes.data ?? []).map((l) => l.admin_id)));
      const namesMap = new Map<string, string>();
      if (adminIds.length) {
        const { data: profs } = await supabase.from("profiles").select("user_id, full_name, username").in("user_id", adminIds);
        (profs ?? []).forEach((p) => namesMap.set(p.user_id, p.full_name || p.username || "Admin"));
      }

      setKpis({
        users: usersRes.count ?? 0,
        portfolios: portfoliosRes.count ?? 0,
        reports: reportsRes.count ?? 0,
        views: totalViews,
      });
      setSeries(days);
      setLogs(
        (logsRes.data ?? []).map((l) => ({ ...l, admin_name: namesMap.get(l.admin_id) || "Admin" })),
      );
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: "Total Users", value: kpis?.users ?? 0, icon: Users },
    { label: "Active Portfolios", value: kpis?.portfolios ?? 0, icon: Briefcase },
    { label: "Pending Reports", value: kpis?.reports ?? 0, icon: Flag },
    { label: "Total Views", value: kpis?.views ?? 0, icon: Eye },
  ];

  return (
    <AdminLayout title="Dashboard">
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
              <Card key={c.label}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{c.label}</p>
                    <c.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="font-heading text-3xl font-bold mt-2">{c.value.toLocaleString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">New registrations (last 30 days)</CardTitle>
            </CardHeader>
            <CardContent className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series} margin={{ top: 5, right: 16, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} interval={4} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base font-heading">Recent admin activity</CardTitle>
            </CardHeader>
            <CardContent>
              {logs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No activity yet.</p>
              ) : (
                <ul className="divide-y divide-border">
                  {logs.map((l) => (
                    <li key={l.id} className="py-3 flex items-center justify-between gap-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{l.action}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          by {l.admin_name}{l.target_type ? ` · ${l.target_type}` : ""}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {format(new Date(l.created_at), "MMM d, HH:mm")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;
