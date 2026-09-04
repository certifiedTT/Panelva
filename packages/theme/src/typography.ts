export const typography = {
  display: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
  },
  h1: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
  },
  h2: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
  },
  h3: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
  },
  bodySm: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  small: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
} as const;

export type Typography = typeof typography;
export type TypographyVariant = keyof typeof typography;
