export type Party = {
  id: string;
  name: string;
  tone: "lime" | "sky" | "amber" | "coral" | "teal" | "mist";
};

export const KNOWN_PARTIES: Record<string, Party> = {
  user_001: { id: "user_001", name: "Matheus Ferrero", tone: "lime" },
  user_002: { id: "user_002", name: "Floyd Miles", tone: "sky" },
  user_003: { id: "user_003", name: "Jerome Bell", tone: "coral" },
  user_004: { id: "user_004", name: "Cameron Williamson", tone: "amber" },
};

const TONES: Party["tone"][] = ["lime", "sky", "amber", "coral", "teal", "mist"];

export function partyFromId(id: string, fallbackName?: string): Party {
  if (KNOWN_PARTIES[id]) return KNOWN_PARTIES[id];
  const hash = [...id].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return {
    id,
    name: fallbackName ?? id.replace(/_/g, " "),
    tone: TONES[hash % TONES.length] ?? "mist",
  };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[parts.length - 1]![0] ?? ""}`.toUpperCase();
}

export function noteFor(category: "Revenue" | "Expense", name: string): string {
  return category === "Revenue" ? `Transfer from ${name}` : `Transfer to ${name}`;
}
