import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Upload,
  Megaphone,
  MessageSquareText,
  Settings,
  LogOut,
  Menu,
  X,
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
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Mobile top bar (hidden on md+ where the sidebar is always visible) */}
      <header className="flex items-center justify-between border-b border-border bg-muted/40 p-4 md:hidden">
        <div className="text-lg font-semibold">ReachDesk</div>
        <button
          type="button"
          onClick={() => setIsMobileNavOpen(true)}
          aria-label="Open menu"
          className="rounded-md p-2 hover:bg-muted"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      {isMobileNavOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative z-50 flex h-full w-64 flex-col bg-background p-4 shadow-lg">
            <div className="mb-6 flex items-center justify-between px-2">
              <span className="text-lg font-semibold">ReachDesk</span>
              <button
                type="button"
                onClick={() => setIsMobileNavOpen(false)}
                aria-label="Close menu"
                className="rounded-md p-1 hover:bg-muted"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <NavList onNavigate={() => setIsMobileNavOpen(false)} onSignOut={signOut} />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden w-56 flex-col border-r border-border bg-muted/40 p-4 md:flex">
        <div className="mb-6 px-2 text-lg font-semibold">ReachDesk</div>
        <NavList onSignOut={signOut} />
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  );
}

function NavList({ onNavigate, onSignOut }: { onNavigate?: () => void; onSignOut: () => void }) {
  return (
    <>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
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
        onClick={onSignOut}
        className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-muted"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </>
  );
}
