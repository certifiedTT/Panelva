export interface ColorTokens {
  // Primary brand (Cobalt Blue)
  primary: string;
  primaryDark: string;
  primaryLight: string;
  primaryMuted: string;
  primaryForeground: string;

  // Background & Surfaces
  background: string;
  bg: string;
  card: string;
  header: string;
  panel: string;
  surface: string;
  surfaceElevated: string;
  surfaceSecondary: string;
  surfaceMuted: string;

  // Borders
  border: string;
  borderSubtle: string;
  borderFocus: string;

  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textSubtle: string;
  textInverse: string;

  // Status & Feedback
  success: string;
  successMuted: string;
  warning: string;
  warningMuted: string;
  error: string;
  errorMuted: string;
  info: string;
  infoMuted: string;

  // Brand Accent Highlights
  accentGold: string;
  accentGoldMuted: string;
  cardOverlay: string;
}

export const theme = {
  background: '#0F0F1A',
  card: '#1A1A2E',
  primary: '#2563EB',
};

export const darkColors: ColorTokens = {
  // Cobalt Blue Brand
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  primaryMuted: 'rgba(37, 99, 235, 0.15)',
  primaryForeground: '#FFFFFF',

  // Dark Surfaces
  background: '#0F0F1A',
  bg: '#0F0F1A',
  card: '#1A1A2E',
  header: '#12121E',
  panel: '#1A1A2E',
  surface: '#1A1A2E',
  surfaceElevated: '#24243E',
  surfaceSecondary: '#2E2E4A',
  surfaceMuted: 'rgba(255, 255, 255, 0.05)',

  // Borders
  border: '#28283C',
  borderSubtle: '#1C1C2B',
  borderFocus: '#3B82F6',

  // Text
  text: '#FFFFFF',
  textSecondary: '#E2E8F0',
  textMuted: '#94A3B8',
  textSubtle: '#64748B',
  textInverse: '#0F0F1A',

  // Status
  success: '#10B981',
  successMuted: 'rgba(16, 185, 129, 0.15)',
  warning: '#F59E0B',
  warningMuted: 'rgba(245, 158, 11, 0.15)',
  error: '#EF4444',
  errorMuted: 'rgba(239, 68, 68, 0.15)',
  info: '#38BDF8',
  infoMuted: 'rgba(56, 189, 248, 0.15)',

  // Highlights
  accentGold: '#FBBF24',
  accentGoldMuted: 'rgba(251, 191, 36, 0.15)',
  cardOverlay: 'rgba(15, 15, 26, 0.85)',
};

export const lightColors: ColorTokens = {
  // Cobalt Blue Brand
  primary: '#2563EB',
  primaryDark: '#1D4ED8',
  primaryLight: '#3B82F6',
  primaryMuted: 'rgba(37, 99, 235, 0.10)',
  primaryForeground: '#FFFFFF',

  // Light Surfaces
  background: '#F8FAFC',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  header: '#FFFFFF',
  panel: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceElevated: '#F1F5F9',
  surfaceSecondary: '#E2E8F0',
  surfaceMuted: 'rgba(0, 0, 0, 0.03)',

  // Borders
  border: '#E2E8F0',
  borderSubtle: '#F1F5F9',
  borderFocus: '#2563EB',

  // Text
  text: '#0F172A',
  textSecondary: '#334155',
  textMuted: '#64748B',
  textSubtle: '#94A3B8',
  textInverse: '#FFFFFF',

  // Status
  success: '#059669',
  successMuted: 'rgba(5, 150, 105, 0.10)',
  warning: '#D97706',
  warningMuted: 'rgba(217, 119, 6, 0.10)',
  error: '#DC2626',
  errorMuted: 'rgba(220, 38, 38, 0.10)',
  info: '#0284C7',
  infoMuted: 'rgba(2, 132, 199, 0.10)',

  // Highlights
  accentGold: '#D97706',
  accentGoldMuted: 'rgba(217, 119, 6, 0.10)',
  cardOverlay: 'rgba(255, 255, 255, 0.85)',
};
