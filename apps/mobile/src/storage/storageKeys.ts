export const STORAGE_KEYS = {
  HAS_COMPLETED_ONBOARDING: '@panelva/has_completed_onboarding',
  USER_PREFERENCES: '@panelva/user_preferences',
  HAS_SEEN_READER_TUTORIAL: '@panelva/has_seen_reader_tutorial',
  AUTH_TOKEN: 'panelva_auth_token',
  SAVED_USER_PROFILE: '@panelva/saved_user_profile',
  THEME_MODE: '@panelva/theme_mode',
} as const;

export interface UserOnboardingPreferences {
  role: 'READER' | 'CREATOR';
  favoriteGenres: string[];
  preferredFormat: 'COMICS' | 'NOVELS' | 'BOTH';
  notificationsEnabled: boolean;
}
