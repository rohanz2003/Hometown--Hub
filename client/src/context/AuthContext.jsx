/**
 * context/AuthContext.jsx — session state for the whole app.
 *
 * On boot it tries to exchange the httpOnly refresh cookie for a live session, so
 * a reload keeps the user signed in without ever storing a token in localStorage.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/authService';
import * as communityService from '../services/communityService';
import * as userService from '../services/userService';
import { setSessionLostHandler } from '../services/api';
import { useToast } from './ToastContext';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | authenticated | anonymous
  const [moderationAccess, setModerationAccess] = useState({ loading: true, allowed: false });
  const toast = useToast();

  /** Restores the session from the refresh cookie on first mount. */
  useEffect(() => {
    let cancelled = false;

    authService
      .restoreSession()
      .then((restored) => {
        if (!cancelled) {
          setUser(restored);
          setStatus('authenticated');
        }
      })
      .catch(() => {
        // No usable cookie — this is the normal path for a first-time visitor.
        if (!cancelled) {
          setModerationAccess({ loading: false, allowed: false });
          setStatus('anonymous');
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || !user) return undefined;
    if (user.role === 'platform_admin') {
      setModerationAccess({ loading: false, allowed: true });
      return undefined;
    }

    let cancelled = false;
    setModerationAccess({ loading: true, allowed: false });
    communityService
      .myCommunities()
      .then((communities) => {
        if (!cancelled) {
          const allowed = communities.some((community) =>
            ['moderator', 'admin'].includes(community.myRole),
          );
          setModerationAccess({ loading: false, allowed });
        }
      })
      .catch(() => {
        if (!cancelled) setModerationAccess({ loading: false, allowed: false });
      });

    return () => {
      cancelled = true;
    };
  }, [status, user]);

  /** Lets the axios layer tell us the session could not be recovered. */
  useEffect(() => {
    setSessionLostHandler(() => {
      setUser(null);
      setStatus('anonymous');
      toast.error('Your session expired. Please sign in again.');
    });
    return () => setSessionLostHandler(null);
  }, [toast]);

  const adopt = useCallback((nextUser) => {
    setUser(nextUser);
    setModerationAccess({ loading: true, allowed: false });
    setStatus('authenticated');
    return nextUser;
  }, []);

  const login = useCallback((credentials) => authService.login(credentials).then(adopt), [adopt]);

  const register = useCallback((payload) => authService.register(payload).then(adopt), [adopt]);

  const resetPassword = useCallback(
    (payload) => authService.resetPassword(payload).then(adopt),
    [adopt],
  );

  const changePassword = useCallback(
    (payload) => authService.changePassword(payload).then(adopt),
    [adopt],
  );

  const logout = useCallback(async ({ everywhere = false } = {}) => {
    try {
      await (everywhere ? authService.logoutEverywhere() : authService.logout());
    } finally {
      setUser(null);
      setStatus('anonymous');
    }
  }, []);

  /** Applies a partial user update returned by a profile/preferences call. */
  const patchUser = useCallback((patch) => {
    setUser((current) => (current ? { ...current, ...patch } : current));
  }, []);

  const savePreferences = useCallback(async (partial) => {
    // Update optimistically so theme and layout switches feel instant…
    setUser((current) =>
      current ? { ...current, preferences: { ...current.preferences, ...partial } } : current,
    );
    try {
      const preferences = await userService.updatePreferences(partial);
      setUser((current) => (current ? { ...current, preferences } : current));
      return preferences;
    } catch (error) {
      // …and reload the truth if the server rejected it.
      const fresh = await userService.getProfile().catch(() => null);
      if (fresh) setUser(fresh);
      throw error;
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      isPlatformAdmin: user?.role === 'platform_admin',
      canModerate: moderationAccess.allowed,
      moderationAccessLoading: moderationAccess.loading,
      login,
      register,
      logout,
      resetPassword,
      changePassword,
      patchUser,
      savePreferences,
    }),
    [
      user,
      status,
      moderationAccess,
      login,
      register,
      logout,
      resetPassword,
      changePassword,
      patchUser,
      savePreferences,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}

export default AuthContext;
