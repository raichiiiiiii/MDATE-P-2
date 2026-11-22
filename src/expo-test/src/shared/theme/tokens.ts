/** Shared visual tokens for the patient-facing MDATE application. */
export const colors = {
  page: "#F8FAFC",
  surface: "#FFFFFF",
  surfaceSubtle: "#F1F5F9",
  primary: "#174EA6",
  primaryStrong: "#123B70",
  primaryTint: "#EAF2FF",
  text: "#172B4D",
  textSecondary: "#52657A",
  textMuted: "#64748B",
  border: "#DFE7F0",
  borderStrong: "#B8C7D9",
  success: "#16734A",
  danger: "#B42318",
  warning: "#996515",
} as const;

/** Palette additions for high-contrast presentation on light surfaces. */
export const highContrastColors = {
  text: "#000000",
  textSecondary: "#171717",
  textMuted: "#262626",
  border: "#4B5563",
  borderStrong: "#1F2937",
  surface: "#FFFFFF",
  surfaceSubtle: "#FFFFFF",
  primary: "#073B86",
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  pill: 999,
} as const;

/** Typography sizes are nominal; the shared native text layer enforces the 16px floor. */
export const typography = {
  xs: 16,
  sm: 16,
  body: 16,
  bodyLarge: 18,
  heading: 24,
  display: 30,
} as const;

export const layout = {
  patientViewportMaxWidth: 430,
  minimumTouchTarget: 48,
} as const;
