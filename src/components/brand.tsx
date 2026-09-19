import { cn } from "@/lib/cn";

export function PentaMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("size-8", className)}
      aria-hidden
    >
      <rect width="32" height="32" rx="8" fill="var(--color-accent)" />
      <path
        d="M10 8.5h7.4c3.2 0 5.4 1.9 5.4 4.8 0 2.9-2.2 4.8-5.4 4.8H13.4V23.5H10V8.5Zm3.4 6.7h3.7c1.4 0 2.2-.8 2.2-1.9s-.8-1.9-2.2-1.9h-3.7v3.8Z"
        fill="var(--color-accent-fg)"
      />
    </svg>
  );
}

export function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  return (
    <span className="flex items-center gap-2.5">
      <PentaMark className={size === "sm" ? "size-7" : "size-8"} />
      <span
        className={cn(
          "font-display font-semibold tracking-tight text-fg",
          size === "sm" ? "text-lg" : "text-xl",
        )}
      >
        Penta
      </span>
    </span>
  );
}
