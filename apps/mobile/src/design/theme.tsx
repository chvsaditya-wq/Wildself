import * as SystemUI from 'expo-system-ui';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

import { deviceStore, type KeyValueStore } from '@/lib/storage';

import { colors, type ColorScheme, type ColorTokens } from './tokens';

export type ThemePreference = 'system' | 'light' | 'dark';

const PREFERENCE_KEY = 'theme-preference';

type ThemeValue = {
  scheme: ColorScheme;
  colors: ColorTokens;
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeValue | null>(null);

function readPreference(store: KeyValueStore): ThemePreference {
  const stored = store.getItem(PREFERENCE_KEY);
  return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
}

export function AppThemeProvider({
  children,
  store = deviceStore,
}: {
  children: ReactNode;
  store?: KeyValueStore;
}) {
  const systemScheme = useColorScheme();
  // Read synchronously on first render, so the app never flashes the wrong theme.
  const [preference, setPreferenceState] = useState<ThemePreference>(() => readPreference(store));

  const scheme: ColorScheme =
    preference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : preference;
  const palette = colors[scheme];

  useEffect(() => {
    // Keeps the native root view the same colour as the app, so no white edge shows during transitions.
    SystemUI.setBackgroundColorAsync(palette.paper).catch(() => undefined);
  }, [palette.paper]);

  const setPreference = (next: ThemePreference) => {
    store.setItem(PREFERENCE_KEY, next);
    setPreferenceState(next);
  };

  return (
    <ThemeContext.Provider value={{ scheme, colors: palette, preference, setPreference }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeValue {
  const value = useContext(ThemeContext);
  if (!value) {
    throw new Error('useTheme must be used inside <AppThemeProvider>');
  }
  return value;
}
