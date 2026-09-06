/**
 * components/layout/Sidebar.jsx — primary navigation on tablet and desktop.
 *
 * Collapses to an icon rail; the collapsed state is a saved user preference
 * (design.md § 4), so it survives a reload and follows the user across devices.
 */
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from './navItems';
import {
  CollapseIcon,
  ExpandIcon,
} from './navIcons';

export default function Sidebar({ unreadCount = 0 }) {
  const { isPlatformAdmin } = useAuth();
  const { sidebarCollapsed, toggleSidebar } = useTheme();

  const items = isPlatformAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <aside
      className={`sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r border-line bg-surface transition-[width] md:block ${
        sidebarCollapsed ? 'w-16' : 'w-56'
      }`}
    >
      <nav
        aria-label="Main navigation"
        className="flex h-full flex-col gap-1 overflow-y-auto p-2 hh-scroll-thin"
      >
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={sidebarCollapsed ? item.label : undefined}
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  sidebarCollapsed ? 'justify-center px-0' : '',
                  isActive
                    ? 'bg-primary-soft text-primary'
                    : 'text-ink-muted hover:bg-surface-hover hover:text-ink',
                ]
                  .filter(Boolean)
                  .join(' ')
              }
            >
              <Icon
                aria-hidden="true"
                className={`flex-shrink-0 h-5 w-5 transition-transform duration-150 ${
                  sidebarCollapsed ? '' : 'text-base'
                }`}
                strokeWidth={2}
              />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}

              {item.badge === 'unread' && unreadCount > 0 && (
                <span
                  className={`ml-auto rounded-full bg-error px-1.5 py-0.5 text-[10px] font-semibold text-white ${
                    sidebarCollapsed ? 'absolute ml-0 translate-x-3 -translate-y-2.5' : ''
                  }`}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                  <span className="sr-only"> unread notifications</span>
                </span>
              )}
            </NavLink>
          );
        })}

        <button
          type="button"
          onClick={toggleSidebar}
          aria-expanded={!sidebarCollapsed}
          aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-ink-subtle transition-colors hover:bg-surface-hover hover:text-ink"
        >
          {sidebarCollapsed ? <ExpandIcon className="h-5 w-5" strokeWidth={2} /> : <CollapseIcon className="h-5 w-5" strokeWidth={2} />}
          {!sidebarCollapsed && <span>Collapse</span>}
        </button>
      </nav>
    </aside>
  );
}