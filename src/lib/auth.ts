export type SessionUser = {
  id: string;
  displayName: string;
  primaryEmail: string;
};

type Account = SessionUser & { password: string };

const USERS_KEY = "penta.users.v1";
const SESSION_KEY = "penta.session.v1";

const DEMO: Account = {
  id: "demo-alex",
  displayName: "Alex Rivera",
  primaryEmail: "alex@penta.finance",
  password: "demo1234",
};

function loadUsers(): Account[] {
  try {
    const raw = localStorage.getItem(USERS_KEY);
    if (!raw) return [DEMO];
    const parsed = JSON.parse(raw) as Account[];
    if (!parsed.some((u) => u.primaryEmail === DEMO.primaryEmail)) return [DEMO, ...parsed];
    return parsed;
  } catch {
    return [DEMO];
  }
}

function saveUsers(users: Account[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((fn) => fn());
}

export function subscribeSession(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSession(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function signIn(email: string, password: string): SessionUser {
  const users = loadUsers();
  const hit = users.find((u) => u.primaryEmail.toLowerCase() === email.trim().toLowerCase());
  if (!hit || hit.password !== password) {
    throw new Error("Invalid email or password");
  }
  const session: SessionUser = {
    id: hit.id,
    displayName: hit.displayName,
    primaryEmail: hit.primaryEmail,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emit();
  return session;
}

export function signUp(name: string, email: string, password: string): SessionUser {
  if (password.length < 6) throw new Error("Password must be at least 6 characters");
  const users = loadUsers();
  if (users.some((u) => u.primaryEmail.toLowerCase() === email.trim().toLowerCase())) {
    throw new Error("An account with that email already exists");
  }
  const account: Account = {
    id: `user-${Date.now()}`,
    displayName: name.trim() || email.split("@")[0] || "Analyst",
    primaryEmail: email.trim().toLowerCase(),
    password,
  };
  users.push(account);
  saveUsers(users);
  const session: SessionUser = {
    id: account.id,
    displayName: account.displayName,
    primaryEmail: account.primaryEmail,
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  emit();
  return session;
}

export function signOut() {
  localStorage.removeItem(SESSION_KEY);
  emit();
}

export const DEMO_EMAIL = DEMO.primaryEmail;
export const DEMO_PASSWORD = DEMO.password;
