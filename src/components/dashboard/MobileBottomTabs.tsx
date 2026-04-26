import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Inbox,
  UserCog,
  Settings as SettingsIcon,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Props {
  unread: number;
}

const items = [
  { to: "/dashboard", label: "Home", icon: LayoutDashboard, end: true },
  { to: "/dashboard/portfolio", label: "Portfolio", icon: Briefcase, end: false },
  { to: "/dashboard/inbox", label: "Inbox", icon: Inbox, end: false, badge: true },
  { to: "/dashboard/profile", label: "Profile", icon: UserCog, end: false },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon, end: false },
];

/**
 * Mobile-only bottom navigation tab bar for the dashboard.
 */
const MobileBottomTabs = ({ unread }: Props) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border"
      aria-label="Dashboard navigation"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors relative",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              <item.icon className="h-5 w-5" aria-hidden="true" />
              <span>{item.label}</span>
              {item.badge && unread > 0 && (
                <Badge className="absolute top-1 right-[calc(50%-22px)] h-4 min-w-4 px-1 text-[10px]">
                  {unread > 9 ? "9+" : unread}
                </Badge>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileBottomTabs;
