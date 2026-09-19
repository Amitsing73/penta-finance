import { cn } from "@/lib/cn";
import { initials, type Party } from "@/lib/finance/parties";

const TONE: Record<Party["tone"], string> = {
  lime: "bg-accent/20 text-accent",
  sky: "bg-sky/20 text-sky",
  amber: "bg-expense/20 text-expense",
  coral: "bg-coral/20 text-coral",
  teal: "bg-teal/20 text-teal",
  mist: "bg-mist/20 text-mist",
};

export function PartyAvatar({
  name,
  tone,
  size = "md",
}: {
  name: string;
  tone: Party["tone"];
  size?: "sm" | "md" | "lg";
}) {
  const dim = size === "sm" ? "size-8 text-[11px]" : size === "lg" ? "size-11 text-sm" : "size-9 text-xs";
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-display font-semibold",
        dim,
        TONE[tone],
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
