/**
 * components/layout/navItems.js — the app's primary navigation.
 *
 * One list feeds the sidebar, the mobile tab bar, and the user menu, so a route
 * can never appear in one place and be missing from another.
 */
export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '🏠', mobile: true },
  { to: '/feed', label: 'Feed', icon: '📰', mobile: true },
  { to: '/communities', label: 'Communities', icon: '🏘️', mobile: true },
  { to: '/events', label: 'Events', icon: '📅', mobile: true },
  { to: '/notifications', label: 'Notifications', icon: '🔔', mobile: false, badge: 'unread' },
  { to: '/moderation', label: 'Moderation', icon: '🛡️', mobile: false },
  { to: '/profile', label: 'Profile', icon: '👤', mobile: true },
  { to: '/settings', label: 'Settings', icon: '⚙️', mobile: false },
];

/** Platform-admin-only entries, appended for that role. */
export const ADMIN_NAV_ITEMS = [{ to: '/admin', label: 'Admin', icon: '📊', mobile: false }];
