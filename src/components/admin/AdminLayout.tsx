import { ReactNode, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAdmin } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Flag,
  Tags,
  ScrollText,
  LogOut,
  Loader2,
  Menu,
  X,
  ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  children: ReactNode;
  title?: string;
}

const navItems = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/users", label: "Manage Users", icon: Users, end: false },
  { to: "/admin/portfolios", label: "Portfolios", icon: Briefcase, end: false },
  { to: "/admin/reports", label: "Reports", icon: Flag, end: false },
  { to: "/admin/categories", label: "Categories", icon: Tags, end: false },
  { to: "/admin/logs", label: "Audit Logs", icon: ScrollText, end: false },
];

const AdminLayout = ({ children, title }: Props) => {
  const { isAdmin, loading, user } = useAdmin();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    navigate("/admin/login", { replace: true });
    return null;
  }

  if (!isAdmin) {
    toast({ title: "Unauthorized", description: "You don't have access to the admin panel.", variant: "destructive" });
    navigate("/", { replace: true });
    return null;
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login", { replace: true });
  };

  const sidebar = (
    <nav className="flex flex-col h-full text-slate-100">
      <Link to="/admin" className="flex items-center gap-2 px-5 h-16 border-b border-slate-800" onClick={() => setMobileOpen(false)}>
        <ShieldCheck className="h-6 w-6 text-primary" />
        <span className="font-heading font-bold tracking-tight">PortoBank Admin</span>
      </Link>
      <div className="flex-1 p-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white",
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </div>
      <div className="p-3 border-t border-slate-800 text-xs text-slate-400">
        Signed in as<br />
        <span className="text-slate-200 truncate block">{user.email}</span>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <aside className="hidden md:flex md:w-64 md:flex-col bg-slate-900 sticky top-0 h-screen">
        {sidebar}
      </aside>

      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-slate-900/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-slate-900 h-full">
            <button
              className="absolute top-4 right-3 p-2 rounded-md text-slate-300 hover:bg-slate-800"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between gap-3 px-4 md:px-8 h-16">
            <div className="flex items-center gap-2 min-w-0">
              <button
                className="md:hidden p-2 rounded-md hover:bg-slate-100"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="font-heading font-semibold text-lg truncate">{title ?? "Admin"}</h1>
            </div>
            <div className="flex items-center gap-3">
              <span className="hidden sm:block text-sm text-slate-600 truncate max-w-[200px]">{user.email}</span>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
