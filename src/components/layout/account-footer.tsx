import { LogIn, LogOut, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { getSession, signOut } from "@/lib/auth";
import { initials } from "@/lib/finance/parties";

export function AccountFooter({ onNavigate }: { onNavigate?: () => void }) {
  const user = getSession();

  if (!user) {
    return (
      <div className="mt-auto border-t border-border p-3">
        <div className="grid gap-2">
          <Link
            to="/login?mode=signup"
            onClick={onNavigate}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-sm bg-accent text-sm font-medium text-accent-fg hover:opacity-90"
          >
            <UserPlus className="size-4" />
            Create account
          </Link>
          <Link
            to="/login"
            onClick={onNavigate}
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-sm border border-border text-sm font-medium text-fg hover:bg-surface-2"
          >
            <LogIn className="size-4" />
            Sign in
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-auto border-t border-border p-3">
      <div className="rounded-lg bg-surface p-2.5">
        <div className="flex items-center gap-2.5">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-xs font-semibold text-accent-fg">
            {initials(user.displayName)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">{user.displayName}</p>
            <p className="truncate text-[11px] text-muted">{user.primaryEmail}</p>
          </div>
        </div>
        <div className="mt-2.5 grid gap-1.5">
          <Link
            to="/login?mode=signup"
            onClick={onNavigate}
            className="flex h-9 items-center justify-center gap-2 rounded-sm text-sm font-medium text-accent hover:bg-surface-2"
          >
            <UserPlus className="size-3.5" />
            Create account
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              signOut();
              window.location.assign("/login");
            }}
            className="w-full text-muted hover:bg-danger/10 hover:text-danger"
          >
            <LogOut className="size-3.5" />
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
