import { Eye, EyeOff } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Wordmark } from "@/components/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DEMO_EMAIL, DEMO_PASSWORD, getSession, signIn, signUp } from "@/lib/auth";

export function LoginPage() {
  const user = getSession();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signup" ? "signup" : "signin",
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState(DEMO_PASSWORD);
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user && params.get("switch") !== "1") return <Navigate to="/" replace />;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") signUp(name, email, password);
      else signIn(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-dvh bg-bg lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-sidebar p-10 lg:flex lg:flex-col lg:justify-between">
        <Wordmark />
        <div className="relative z-10 max-w-md">
          <p className="font-display text-4xl font-semibold tracking-tight text-balance">
            See where the money moves.
          </p>
          <p className="mt-4 max-w-sm text-muted">
            Track income and expenses, filter every ledger line, and export the exact report you
            need — privately, on this device.
          </p>
        </div>
        <svg viewBox="0 0 480 180" className="absolute inset-x-0 bottom-0 h-48 w-full opacity-70" aria-hidden>
          <path
            d="M0,120 C60,90 90,60 140,70 C190,80 220,40 270,30 C320,20 360,26 480,18 L480,180 L0,180 Z"
            fill="color-mix(in oklab, var(--color-accent) 16%, transparent)"
          />
          <path
            d="M0,120 C60,90 90,60 140,70 C190,80 220,40 270,30 C320,20 360,26 480,18"
            fill="none"
            stroke="var(--color-accent)"
            strokeWidth="2"
          />
          <path
            d="M0,148 C70,140 140,150 210,132 C280,114 360,128 480,110"
            fill="none"
            stroke="var(--color-expense)"
            strokeWidth="2"
            strokeDasharray="5 5"
          />
        </svg>
      </section>

      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <Wordmark />
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">
            {mode === "signin" ? "Sign in" : "Create account"}
          </h1>
          <p className="mt-1 text-sm text-muted">
            Demo account: {DEMO_EMAIL} / {DEMO_PASSWORD}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-1 rounded-lg bg-surface p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={
                mode === "signin"
                  ? "h-10 rounded-md bg-surface-2 text-sm font-semibold text-fg"
                  : "h-10 rounded-md text-sm font-medium text-muted hover:text-fg"
              }
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={
                mode === "signup"
                  ? "h-10 rounded-md bg-surface-2 text-sm font-semibold text-fg"
                  : "h-10 rounded-md text-sm font-medium text-muted hover:text-fg"
              }
            >
              Sign up
            </button>
          </div>

          <form onSubmit={submit} className="mt-6 grid gap-4">
            {mode === "signup" && (
              <div>
                <Label htmlFor="name">Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-11"
                />
                <button
                  type="button"
                  className="absolute top-1/2 right-2 -translate-y-1/2 p-2 text-muted"
                  onClick={() => setShow((s) => !s)}
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
            <Button type="submit" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
