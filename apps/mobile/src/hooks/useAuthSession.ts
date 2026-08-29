import { useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../storage/storageKeys';
import { MockRoleKey, MOCK_ACCOUNTS_MAP } from '../data/mockRoles';

const MOCK_ROLE_STORAGE_KEY = '@panelva_dev_mock_role';

export function useAuthSession() {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [activeMockRole, setActiveMockRole] = useState<MockRoleKey | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore stored session on app startup
  useEffect(() => {
    let isMounted = true;
    async function restoreSession() {
      try {
        // In development mode, check if a dev mock role was active
        if (__DEV__) {
          const savedMockRole = await AsyncStorage.getItem(MOCK_ROLE_STORAGE_KEY);
          if (savedMockRole && MOCK_ACCOUNTS_MAP[savedMockRole as MockRoleKey]) {
            const mockRole = savedMockRole as MockRoleKey;
            const profile = MOCK_ACCOUNTS_MAP[mockRole];
            if (isMounted) {
              setActiveMockRole(mockRole);
              setSessionToken(`mock-dev-token-${mockRole.toLowerCase()}`);
              setSessionUser({
                id: profile.id,
                email: profile.email,
                username: profile.username,
                role: profile.roleKey,
                subscription: profile.subscription,
                creditsBalance: profile.creditsBalance,
                wCoinBalance: profile.wCoinBalance,
                avatarUrl: profile.avatarUrl,
                bio: profile.bio,
                isMock: true,
              });
              setIsRestoring(false);
              return;
            }
          }
        }

        let token: string | null = null;
        try {
          token = await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
        } catch {
          // Fallback to AsyncStorage if SecureStore unavailable on platform
          token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
        }

        const userStr = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_USER_PROFILE);
        const user = userStr ? JSON.parse(userStr) : null;

        if (isMounted) {
          if (token) setSessionToken(token);
          if (user) setSessionUser(user);
        }
      } catch (err) {
        console.warn('Failed to restore auth session:', err);
      } finally {
        if (isMounted) {
          setIsRestoring(false);
        }
      }
    }

    restoreSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const saveSession = useCallback(async (token: string, user: any) => {
    try {
      try {
        await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
      } catch {
        await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_USER_PROFILE, JSON.stringify(user));
      setSessionToken(token);
      setSessionUser(user);
      if (__DEV__) {
        setActiveMockRole(null);
        await AsyncStorage.removeItem(MOCK_ROLE_STORAGE_KEY);
      }
    } catch (err) {
      console.warn('Failed to save session:', err);
      setSessionToken(token);
      setSessionUser(user);
    }
  }, []);

  const clearSession = useCallback(async () => {
    try {
      try {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
      } catch {
        await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      }
      await AsyncStorage.removeItem(STORAGE_KEYS.SAVED_USER_PROFILE);
      if (__DEV__) {
        await AsyncStorage.removeItem(MOCK_ROLE_STORAGE_KEY);
        setActiveMockRole(null);
      }
      setSessionToken(null);
      setSessionUser(null);
    } catch (err) {
      console.warn('Failed to clear session:', err);
      setSessionToken(null);
      setSessionUser(null);
    }
  }, []);

  /**
   * Switch to a development mock role instantly in-memory.
   * Only active in Development / Preview mode.
   */
  const switchMockRole = useCallback(async (roleKey: MockRoleKey) => {
    if (!__DEV__) {
      console.warn('Mock role switcher is only available in development mode.');
      return;
    }

    const profile = MOCK_ACCOUNTS_MAP[roleKey];
    if (!profile) {
      console.warn(`Unknown mock role: ${roleKey}`);
      return;
    }

    const mockToken = `mock-dev-token-${roleKey.toLowerCase()}-${Date.now()}`;
    const mockUser = {
      id: profile.id,
      email: profile.email,
      username: profile.username,
      role: profile.roleKey,
      subscription: profile.subscription,
      creditsBalance: profile.creditsBalance,
      wCoinBalance: profile.wCoinBalance,
      avatarUrl: profile.avatarUrl,
      bio: profile.bio,
      isMock: true,
    };

    setActiveMockRole(roleKey);
    setSessionToken(mockToken);
    setSessionUser(mockUser);

    try {
      await AsyncStorage.setItem(MOCK_ROLE_STORAGE_KEY, roleKey);
    } catch (e) {
      console.warn('Failed to persist mock role selection:', e);
    }
  }, []);

  return {
    sessionToken,
    sessionUser,
    activeMockRole,
    isMockMode: !!activeMockRole || (sessionUser?.isMock ?? false),
    isRestoring,
    saveSession,
    clearSession,
    switchMockRole,
  };
}

