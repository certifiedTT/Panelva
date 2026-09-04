export const colors = {
  primary: "#2563EB",
  background: "#0F172A",
  surface: "#111827",
  card: "#1F2937",
  border: "#374151",
  text: "#F9FAFB",
  textMuted: "#9CA3AF",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
} as const;

export type Colors = typeof colors;
export type ColorKey = keyof typeof colors;
