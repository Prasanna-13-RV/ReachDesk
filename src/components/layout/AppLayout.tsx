import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Upload,
  Megaphone,
  MessageSquareText,
  Settings,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/imports", label: "Import", icon: Upload },
  { to: "/campaigns", label: "Campaigns", icon: Megaphone },
  { to: "/templates", label: "Templates", icon: MessageSquareText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout() {
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-border bg-muted/40 p-4">
        <div className="mb-6 px-2 text-lg font-semibold">ReachDesk</div>
        <nav className="flex-1 space-y-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted",
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <button
          type="button"
          onClick={() => signOut()}
          className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
