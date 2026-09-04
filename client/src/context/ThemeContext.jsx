/**
 * context/ThemeContext.jsx — light/dark theme and layout preferences.
 *
 * The preference lives on the user profile (design.md § 4) so it follows them
 * across devices; a localStorage copy only exists to avoid a flash of the wrong
 * theme before the session loads.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const ThemeContext = createContext(null);

const STORAGE_KEY = 'hh-theme';

const readStoredTheme = () => {
  try {
    return localStorage.getItem(STORAGE_KEY) || 'system';
  } catch {
    return 'system';
  }
};

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

export function ThemeProvider({ children }) {
  const { user, savePreferences } = useAuth();
  const [theme, setTheme] = useState(readStoredTheme);

  // The signed-in user's stored preference wins over the local copy.
  useEffect(() => {
    const serverTheme = user?.preferences?.theme;
    if (serverTheme && serverTheme !== theme) setTheme(serverTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to the server value
  }, [user?.preferences?.theme]);

  const resolved = theme === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : theme;

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', resolved === 'dark');
    root.style.colorScheme = resolved;
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* private mode — the server copy still applies next load */
    }
  }, [theme, resolved]);

  // Follow the OS while the preference is "system".
  useEffect(() => {
    if (theme !== 'system' || typeof window === 'undefined') return undefined;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => document.documentElement.classList.toggle('dark', media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [theme]);

  /** Changes the theme and persists it for signed-in users. */
  const applyTheme = useCallback(
    (next) => {
      setTheme(next);
      if (user) savePreferences({ theme: next }).catch(() => {});
    },
    [user, savePreferences],
  );

  const toggleTheme = useCallback(
    () => applyTheme(resolved === 'dark' ? 'light' : 'dark'),
    [applyTheme, resolved],
  );

  /* ── Layout preferences ──────────────────────────────────────────────────── */

  const sidebarCollapsed = user?.preferences?.sidebarCollapsed ?? false;
  const feedView = user?.preferences?.feedView ?? 'list';

  const toggleSidebar = useCallback(() => {
    if (user) savePreferences({ sidebarCollapsed: !sidebarCollapsed }).catch(() => {});
  }, [user, sidebarCollapsed, savePreferences]);

  const setFeedView = useCallback(
    (view) => {
      if (user) savePreferences({ feedView: view }).catch(() => {});
    },
    [user, savePreferences],
  );

  const value = useMemo(
    () => ({
      theme,
      resolvedTheme: resolved,
      isDark: resolved === 'dark',
      setTheme: applyTheme,
      toggleTheme,
      sidebarCollapsed,
      toggleSidebar,
      feedView,
      setFeedView,
    }),
    [
      theme,
      resolved,
      applyTheme,
      toggleTheme,
      sidebarCollapsed,
      toggleSidebar,
      feedView,
      setFeedView,
    ],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}

export default ThemeContext;
