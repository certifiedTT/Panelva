export const breakpoints = {
  mobile: {
    min: 0,
    max: 767,
    query: "(max-width: 767px)",
  },
  tablet: {
    min: 768,
    max: 1023,
    query: "(min-width: 768px) and (max-width: 1023px)",
  },
  desktop: {
    min: 1024,
    max: 1439,
    query: "(min-width: 1024px) and (max-width: 1439px)",
  },
  large: {
    min: 1440,
    max: Infinity,
    query: "(min-width: 1440px)",
  },
} as const;

export type BreakpointKey = keyof typeof breakpoints;
