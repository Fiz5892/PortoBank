import { ReactNode, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
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

/* Ikon ||| (PanelLeft style) pakai SVG sederhana */
const PanelOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="4" width="2" height="12" rx="1" fill="currentColor" />
    <rect x="7" y="4" width="2" height="12" rx="1" fill="currentColor" />
    <rect x="12" y="4" width="2" height="12" rx="1" fill="currentColor" />
  </svg>
);

const AdminLayout = ({ children, title }: Props) => {
  const { isAdmin, loading, user } = useAdmin();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-blue-900/40 border border-blue-700/50 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-blue-400" />
          </div>
          <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
        </div>
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

  const sidebar = (isMobile = false) => (
    <nav className="flex flex-col h-full">
      {/* Brand */}
      <div className="flex items-center h-16 border-b border-slate-800 shrink-0 px-5 gap-3">
        <div className="h-8 w-8 rounded-lg bg-blue-900/60 border border-blue-700/50 flex items-center justify-center shrink-0">
          <ShieldCheck className="h-4 w-4 text-blue-400" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-slate-100 text-sm leading-tight tracking-tight">PortoBank</p>
          <p className="text-xs text-slate-500 leading-tight">Admin Panel</p>
        </div>
      </div>

      {/* Nav items */}
      <div className="flex-1 p-2.5 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={() => isMobile && setMobileOpen(false)}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 group relative px-3 py-2.5",
                isActive
                  ? "bg-blue-700/20 text-blue-400 border border-blue-700/30"
                  : "text-slate-400 hover:bg-slate-800 hover:text-slate-100 border border-transparent"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon className={cn("h-4 w-4 shrink-0", isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300")} />
                <span>{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>

      {/* Footer */}
      <div className="p-3 mx-2.5 mb-2.5 rounded-lg bg-slate-800/60 border border-slate-700/50">
        <p className="text-xs text-slate-500 mb-0.5">Signed in as</p>
        <p className="text-xs text-slate-300 truncate font-medium">{user.email}</p>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen flex bg-slate-950">

      {/* Desktop sidebar — full hide when collapsed */}
      <aside
        className={cn(
          "hidden md:flex md:flex-col bg-slate-900 border-r border-slate-800 sticky top-0 h-screen transition-all duration-300 shrink-0 overflow-hidden",
          collapsed ? "md:w-0 border-r-0" : "md:w-64"
        )}
      >
        {sidebar()}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-slate-900 border-r border-slate-800 h-full shadow-2xl">
            <button
              className="absolute top-4 right-3 p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
            {sidebar(true)}
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 bg-slate-900/80 backdrop-blur border-b border-slate-800">
          <div className="flex items-center justify-between gap-3 px-4 md:px-6 h-16">
            <div className="flex items-center gap-3 min-w-0">
              {/* Toggle: ||| saat sidebar tutup, ☰ saat sidebar buka */}
              <button
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-slate-100 transition-colors"
                onClick={() => {
                  if (window.innerWidth >= 768) {
                    setCollapsed((v) => !v);
                  } else {
                    setMobileOpen(true);
                  }
                }}
                aria-label="Toggle menu"
              >
                {collapsed ? <PanelOpenIcon /> : <Menu className="h-5 w-5" />}
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <div className="h-1 w-1 rounded-full bg-blue-400 shrink-0" />
                <h1 className="font-semibold text-slate-100 text-base truncate">{title ?? "Dashboard"}</h1>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex flex-col items-end">
                <span className="text-xs text-slate-400 truncate max-w-[180px]">{user.email}</span>
                <span className="text-xs text-blue-400 font-medium">Administrator</span>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-900/60 border border-blue-700/50 flex items-center justify-center text-xs font-semibold text-blue-300 shrink-0">
                {user.email?.[0]?.toUpperCase()}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-slate-400 hover:text-red-400 hover:bg-red-400/10 border border-slate-700 hover:border-red-400/30 h-8 px-3 gap-1.5 transition-colors"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-xs">Logout</span>
              </Button>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default AdminLayout;
