import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ColorTokens, darkColors, lightColors } from './colors';
import { STORAGE_KEYS } from '../storage/storageKeys';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextValue {
  themeMode: ThemeMode;
  isDark: boolean;
  colors: ColorTokens;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [isLoaded, setIsLoaded] = useState(false);

  // Restore stored theme mode on launch
  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
        if (saved === 'system' || saved === 'light' || saved === 'dark') {
          setThemeModeState(saved);
        }
      } catch (err) {
        console.warn('Failed to restore theme preference:', err);
      } finally {
        setIsLoaded(true);
      }
    }
    loadTheme();
  }, []);

  const setThemeMode = useCallback(async (mode: ThemeMode) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
      setThemeModeState(mode);
    } catch (err) {
      console.warn('Failed to save theme preference:', err);
      setThemeModeState(mode);
    }
  }, []);

  // Compute active theme
  const isDark = themeMode === 'system' 
    ? systemColorScheme !== 'light' 
    : themeMode === 'dark';

  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ themeMode, isDark, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
