import type { ComponentProps } from "react";
import { Ionicons } from "@expo/vector-icons";

export type DashboardRoute = "/dashboard" | "/modules" | "/progress" | "/setting";
export type DashboardIconName = ComponentProps<typeof Ionicons>["name"];

export type DashboardAction = {
  id: string;
  title: string;
  icon: DashboardIconName;
  href: DashboardRoute;
  destinationLabel: string;
};

/**
 * The existing main Stack contains four screens. The eight dashboard shortcuts
 * intentionally navigate to those four screens; they do not imply eight
 * separately implemented destinations.
 */
export const DASHBOARD_ACTIONS: readonly DashboardAction[] = [
  { id: "dashboard", title: "Dashboard", icon: "home-outline", href: "/dashboard", destinationLabel: "Dashboard" },
  { id: "start-training", title: "Start Training", icon: "flash-outline", href: "/modules", destinationLabel: "Modules" },
  { id: "modules", title: "Modules", icon: "book-outline", href: "/modules", destinationLabel: "Modules" },
  { id: "progress", title: "Progress", icon: "stats-chart-outline", href: "/progress", destinationLabel: "Progress" },
  { id: "session-history", title: "History", icon: "time-outline", href: "/progress", destinationLabel: "Progress" },
  { id: "settings", title: "Settings", icon: "settings-outline", href: "/setting", destinationLabel: "Settings" },
  { id: "accessibility", title: "Accessibility", icon: "eye-outline", href: "/setting", destinationLabel: "Settings" },
  { id: "voice-preferences", title: "Voice", icon: "volume-high-outline", href: "/setting", destinationLabel: "Settings" },
];
