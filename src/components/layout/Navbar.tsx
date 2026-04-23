import { Link, NavLink as RouterNavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Menu, X, LayoutDashboard, LogOut, UserCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/explore", label: "Explore" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{
    username: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("username, full_name, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data ?? null));
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate("/");
  };

  const initials =
    (profile?.full_name || user?.email || "P")
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-heading font-bold">
            P
          </div>
          <span className="font-heading text-lg font-bold tracking-tight">PortoBank</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <RouterNavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              className={({ isActive }) =>
                cn(
                  "px-3 py-2 text-sm font-medium rounded-md transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {item.label}
            </RouterNavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {user ? (
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
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Link>
                </DropdownMenuItem>
                {profile?.username && (
                  <DropdownMenuItem asChild>
                    <Link to={`/${profile.username}`}>
                      <UserCircle2 className="mr-2 h-4 w-4" /> View profile
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link to="/register">Get started</Link>
              </Button>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 rounded-md hover:bg-secondary"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="container py-4 flex flex-col gap-1">
            {navItems.map((item) => (
              <RouterNavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                onClick={() => setOpen(false)}
                className={({ isActive }) =>
                  cn(
                    "px-3 py-2 text-sm font-medium rounded-md",
                    isActive ? "text-primary bg-secondary" : "text-muted-foreground",
                  )
                }
              >
                {item.label}
              </RouterNavLink>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-border mt-2">
              {user ? (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/dashboard" onClick={() => setOpen(false)}>Dashboard</Link>
                  </Button>
                  {profile?.username && (
                    <Button variant="ghost" asChild>
                      <Link to={`/${profile.username}`} onClick={() => setOpen(false)}>View profile</Link>
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => { setOpen(false); handleSignOut(); }}>
                    Sign out
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="ghost" asChild>
                    <Link to="/login" onClick={() => setOpen(false)}>Sign in</Link>
                  </Button>
                  <Button asChild>
                    <Link to="/register" onClick={() => setOpen(false)}>Get started</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
