import { NavLink } from "react-router-dom";
import { Wordmark } from "@/components/brand";
import { cn } from "@/lib/cn";
import { AccountFooter } from "./account-footer";
import { NAV } from "./nav";

export function Sidebar({
  unread = 0,
  onNavigate,
}: {
  unread?: number;
  onNavigate?: () => void;
}) {
  return (
    <aside className="flex h-full flex-col bg-sidebar">
      <div className="flex h-16 items-center px-5">
        <Wordmark />
      </div>
      <nav className="mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto px-3">
        {NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "relative flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors duration-150",
                  isActive ? "bg-surface-2 text-fg" : "text-muted hover:bg-surface-2/70 hover:text-fg",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-accent" />
                  )}
                  <Icon className={cn("size-4", isActive ? "text-accent" : "text-muted")} />
                  <span className="flex-1">{item.label}</span>
                  {item.to === "/alerts" && unread > 0 && (
                    <span className="grid min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[10px] font-semibold text-fg">
                      {unread > 9 ? "9+" : unread}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      <AccountFooter onNavigate={onNavigate} />
    </aside>
  );
}
