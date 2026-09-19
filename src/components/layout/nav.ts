import {
  BarChart3,
  Bell,
  LayoutGrid,
  PiggyBank,
  Receipt,
  Settings,
  Upload,
  UserRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
};

export const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/transactions", label: "Transactions", icon: Receipt },
  { to: "/wallet", label: "Wallet", icon: Wallet },
  { to: "/budgets", label: "Budgets", icon: PiggyBank },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/upload", label: "Upload", icon: Upload },
  { to: "/personal", label: "Personal", icon: UserRound },
  { to: "/alerts", label: "Message", icon: Bell },
  { to: "/settings", label: "Setting", icon: Settings },
];
