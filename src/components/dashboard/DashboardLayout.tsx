import { ReactNode, useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  Briefcase,
  UserCog,
  Inbox,
  Settings as SettingsIcon,
  ExternalLink,
  Loader2,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import MobileBottomTabs from "@/components/dashboard/MobileBottomTabs";
import { toast } from "sonner";

interface DashboardProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface Props {
  children: ReactNode;
}

const DashboardLayout = ({ children }: Props) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<DashboardProfile | null>(null);
  const [unread, setUnread] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    const load = async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url")
        .eq("user_id", user.id)
        .maybeSingle();
      setProfile(p);

      const { count } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", user.id)
        .eq("is_read", false);
      setUnread(count ?? 0);
    };
    load();
  }, [user, loading, navigate]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const slug = profile?.username ?? profile?.id;
  const initials = (profile?.full_name || user.email || "P")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navItems = [
    { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
    { to: "/dashboard/portfolio", label: "My Portfolio", icon: Briefcase, end: false },
    { to: "/dashboard/profile", label: "Edit Profile", icon: UserCog, end: false },
    { to: "/dashboard/inbox", label: "Inbox", icon: Inbox, end: false, badge: unread },
  ];

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const sidebar = (
    <nav className="flex flex-col gap-1 p-4">
      <Link to="/" className="flex items-center gap-2 mb-6 px-2" onClick={() => setMobileOpen(false)}>
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-heading font-bold">
          P
        </div>
        <span className="font-heading text-lg font-bold tracking-tight">PortoBank</span>
      </Link>
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={() => setMobileOpen(false)}
          className={({ isActive }) =>
            cn(
              "flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary",
            )
          }
        >
          <span className="flex items-center gap-2.5">
            <item.icon className="h-4 w-4" />
            {item.label}
          </span>
          {item.badge ? (
            <Badge className="h-5 min-w-5 px-1.5 text-xs">{item.badge}</Badge>
          ) : null}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-secondary/40 flex">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-border bg-background sticky top-0 h-screen">
        {sidebar}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-64 bg-background border-r border-border h-full">
            <button
              className="absolute top-3 right-3 p-2 rounded-md hover:bg-secondary"
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
        <header className="sticky top-0 z-30 bg-background/85 backdrop-blur border-b border-border">
          <div className="flex items-center justify-between gap-3 px-4 md:px-8 h-16">
            <div className="flex items-center gap-2 min-w-0">
              <button
                className="md:hidden p-2 rounded-md hover:bg-secondary"
                onClick={() => setMobileOpen(true)}
                aria-label="Open menu"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground hidden sm:block">Welcome back</p>
                <p className="font-heading font-semibold truncate">
                  {profile?.full_name || user.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {slug && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/${slug}`} target="_blank">
                    <span className="hidden sm:inline">View my public page</span>
                    <span className="sm:hidden">Public</span>
                    <ExternalLink className="ml-2 h-3.5 w-3.5" />
                  </Link>
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
                    <Avatar className="h-9 w-9">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile.full_name ?? "Profile"} />}
                      <AvatarFallback className="bg-primary/10 text-primary font-heading font-semibold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-sm font-medium">{profile?.full_name ?? "Account"}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/profile">
                      <UserCog className="mr-2 h-4 w-4" /> Edit profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard/settings">
                      <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="mr-2 h-4 w-4" /> Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 md:px-8 py-6 md:py-8 has-bottom-tabs md:!pb-8">
          {children}
        </main>
      </div>

      <MobileBottomTabs unread={unread} />
    </div>
  );
};

export default DashboardLayout;
