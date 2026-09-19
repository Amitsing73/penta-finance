import { useQuery } from "@tanstack/react-query";
import { Bell, Menu, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { getSession } from "@/lib/auth";
import { listAlerts } from "@/lib/finance/queries";
import { initials } from "@/lib/finance/parties";
import { NAV } from "./nav";
import { Sidebar } from "./sidebar";

function pageTitle(pathname: string): string {
  const hit = NAV.find((n) =>
    n.to === "/" ? pathname === "/" : pathname === n.to || pathname.startsWith(`${n.to}/`),
  );
  return hit?.label ?? "Dashboard";
}

export function AppShell() {
  const user = getSession();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const alertsQuery = useQuery({
    queryKey: ["alerts"],
    queryFn: () => listAlerts(),
    enabled: Boolean(user),
    refetchInterval: 30_000,
  });
  const unread = alertsQuery.data?.unread ?? 0;

  if (!user) return <Navigate to="/login" replace />;

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    void navigate(term ? `/transactions?q=${encodeURIComponent(term)}` : "/transactions");
  };

  return (
    <div className="flex min-h-dvh bg-bg">
      <div className="sticky top-0 hidden h-dvh w-60 shrink-0 border-r border-border md:block">
        <Sidebar unread={unread} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-bg/90 px-4 backdrop-blur-sm md:px-6">
          <Sheet open={open} onOpenChange={setOpen}>
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Button>
            <SheetContent side="left" className="p-0">
              <Sidebar unread={unread} onNavigate={() => setOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="md:hidden">
            <Wordmark size="sm" />
          </div>
          <h1 className="hidden font-display text-lg font-semibold tracking-tight md:block">
            {pageTitle(location.pathname)}
          </h1>

          <form onSubmit={onSearch} className="relative ml-auto hidden max-w-sm flex-1 md:block">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="h-10 rounded-full bg-surface pl-9"
              aria-label="Search transactions"
            />
          </form>

          <Link
            to="/alerts"
            className="relative ml-auto grid size-10 place-items-center rounded-full bg-surface text-muted hover:text-fg md:ml-0"
            aria-label="Alerts"
          >
            <Bell className="size-4" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-danger" />
            )}
          </Link>

          <Link
            to="/personal"
            className="hidden size-10 place-items-center overflow-hidden rounded-full bg-surface md:grid"
            aria-label={user.displayName}
          >
            <span className="text-sm font-semibold text-accent">
              {initials(user.displayName)}
            </span>
          </Link>
        </header>

        <main className="flex-1 px-4 py-5 md:px-6 md:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
