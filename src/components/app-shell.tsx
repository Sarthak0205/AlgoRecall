import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Brain, LayoutDashboard, Plus, Repeat2, List, LogOut, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const nav = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/revise", label: "Revise", icon: Repeat2 },
    { to: "/problems", label: "Problems", icon: List },
    { to: "/add", label: "Add", icon: Plus },
    { to: "/import", label: "Import", icon: Upload },
  ] as const;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
              <Brain className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline">AlgoRecall</span>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.map((n) => {
              const active = pathname === n.to;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-accent text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                  }`}
                >
                  <n.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{n.label}</span>
                </Link>
              );
            })}
            <button
              onClick={signOut}
              className="ml-1 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/60"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
