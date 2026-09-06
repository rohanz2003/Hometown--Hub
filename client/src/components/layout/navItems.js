/**
 * components/layout/navItems.js — the app's primary navigation.
 *
 * One list feeds the sidebar, the mobile tab bar, and the user menu, so a route
 * can never appear in one place and be missing from another.
 */
import {
  DashboardIcon,
  FeedIcon,
  CommunitiesIcon,
  EventsIcon,
  NotificationsIcon,
  ModerationIcon,
  ProfileIcon,
  SettingsIcon,
  AdminIcon,
} from './navIcons';

export const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon, mobile: true },
  { to: '/feed', label: 'Feed', icon: FeedIcon, mobile: true },
  { to: '/communities', label: 'Communities', icon: CommunitiesIcon, mobile: true },
  { to: '/events', label: 'Events', icon: EventsIcon, mobile: true },
  { to: '/notifications', label: 'Notifications', icon: NotificationsIcon, mobile: false, badge: 'unread' },
  { to: '/moderation', label: 'Moderation', icon: ModerationIcon, mobile: false },
  { to: '/profile', label: 'Profile', icon: ProfileIcon, mobile: true },
  { to: '/settings', label: 'Settings', icon: SettingsIcon, mobile: false },
];

/** Platform-admin-only entries, appended for that role. */
export const ADMIN_NAV_ITEMS = [{ to: '/admin', label: 'Admin', icon: AdminIcon, mobile: false }];