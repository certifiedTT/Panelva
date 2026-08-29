import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS, UserOnboardingPreferences } from '../storage/storageKeys';

const DEFAULT_PREFERENCES: UserOnboardingPreferences = {
  role: 'READER',
  favoriteGenres: ['Fantasy', 'Action', 'Romance'],
  preferredFormat: 'BOTH',
  notificationsEnabled: true,
};

export function useOnboarding() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [preferences, setPreferences] = useState<UserOnboardingPreferences>(DEFAULT_PREFERENCES);
  const [hasSeenReaderTutorial, setHasSeenReaderTutorial] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    async function loadOnboardingState() {
      try {
        const [completedVal, prefVal, tutorialVal] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING),
          AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES),
          AsyncStorage.getItem(STORAGE_KEYS.HAS_SEEN_READER_TUTORIAL),
        ]);

        if (isMounted) {
          setHasCompletedOnboarding(completedVal === 'true');
          if (prefVal) {
            try {
              setPreferences(JSON.parse(prefVal));
            } catch {
              setPreferences(DEFAULT_PREFERENCES);
            }
          }
          setHasSeenReaderTutorial(tutorialVal === 'true');
        }
      } catch (err) {
        console.warn('Error reading onboarding state from AsyncStorage:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOnboardingState();
    return () => {
      isMounted = false;
    };
  }, []);

  const completeOnboarding = useCallback(async (newPreferences: UserOnboardingPreferences) => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.HAS_COMPLETED_ONBOARDING, 'true'),
        AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(newPreferences)),
      ]);
      setPreferences(newPreferences);
      setHasCompletedOnboarding(true);
    } catch (err) {
      console.warn('Error saving onboarding completion:', err);
      setHasCompletedOnboarding(true);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.HAS_COMPLETED_ONBOARDING,
        STORAGE_KEYS.USER_PREFERENCES,
        STORAGE_KEYS.HAS_SEEN_READER_TUTORIAL,
      ]);
      setHasCompletedOnboarding(false);
      setPreferences(DEFAULT_PREFERENCES);
      setHasSeenReaderTutorial(false);
    } catch (err) {
      console.warn('Error resetting onboarding state:', err);
    }
  }, []);

  const markReaderTutorialSeen = useCallback(async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.HAS_SEEN_READER_TUTORIAL, 'true');
      setHasSeenReaderTutorial(true);
    } catch (err) {
      console.warn('Error saving reader tutorial state:', err);
      setHasSeenReaderTutorial(true);
    }
  }, []);

  return {
    isLoading,
    hasCompletedOnboarding,
    preferences,
    hasSeenReaderTutorial,
    completeOnboarding,
    resetOnboarding,
    markReaderTutorialSeen,
  };
}
