import { NavLink } from "react-router-dom";
import {
  UserCog,
  Settings as SettingsIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  unread: number;
}

const items = [
  { to: "/dashboard/profile", label: "Profile", icon: UserCog, end: true },
  { to: "/dashboard/settings", label: "Settings", icon: SettingsIcon, end: false },
];

/**
 * Mobile-only bottom navigation tab bar for the dashboard.
 */
const MobileBottomTabs = ({ unread: _unread }: Props) => {
  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-background/95 backdrop-blur border-t border-border"
      aria-label="Dashboard navigation"
    >
      <ul className="grid grid-cols-2">
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
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default MobileBottomTabs;
