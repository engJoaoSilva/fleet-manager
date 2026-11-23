import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const lightColors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#111111',
  textSecondary: '#444444',
  textMuted: '#888888',
  border: '#dddddd',
  input: '#ffffff',
  primary: '#1565c0',
  success: '#2e7d32',
  warning: '#ef6c00',
  danger: '#c62828',
};

export const darkColors: typeof lightColors = {
  background: '#121212',
  card: '#1e1e1e',
  text: '#f1f1f1',
  textSecondary: '#c4c4c4',
  textMuted: '#8a8a8a',
  border: '#333333',
  input: '#1e1e1e',
  primary: '#4f9cf0',
  success: '#43a047',
  warning: '#fb8c00',
  danger: '#ef5350',
};

export type Colors = typeof lightColors;
type Mode = 'light' | 'dark';

interface ThemeContextValue {
  isDark: boolean;
  colors: Colors;
  toggle: () => void;
}

const THEME_KEY = '@fleetmanager:theme';
const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  colors: lightColors,
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [mode, setMode] = useState<Mode | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => {
        if (saved === 'light' || saved === 'dark') setMode(saved);
      })
      .catch(() => {});
  }, []);

  const isDark = mode ? mode === 'dark' : system === 'dark';

  const value = useMemo<ThemeContextValue>(
    () => ({
      isDark,
      colors: isDark ? darkColors : lightColors,
      toggle: () => {
        const next: Mode = isDark ? 'light' : 'dark';
        setMode(next);
        AsyncStorage.setItem(THEME_KEY, next).catch(() => {});
      },
    }),
    [isDark]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
