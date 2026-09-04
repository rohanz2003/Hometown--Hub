/**
 * components/layout/Navbar.jsx — top bar: brand, search, notifications, account.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Avatar from '../ui/Avatar';
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from './navItems';

export default function Navbar({ unreadCount = 0 }) {
  const { user, logout, isPlatformAdmin } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef(null);

  // Close the account menu on an outside click or Escape.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event) => event.key === 'Escape' && setMenuOpen(false);

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  const handleSearch = (event) => {
    event.preventDefault();
    const term = search.trim();
    if (term) navigate(`/communities?q=${encodeURIComponent(term)}`);
  };

  const menuItems = isPlatformAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
      <div className="flex h-14 items-center gap-2 px-3 sm:gap-4 sm:px-4">
        <Link to="/dashboard" className="flex shrink-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-sm font-bold text-white"
          >
            HH
          </span>
          <span className="hidden text-base font-semibold sm:inline">Hometown Hub</span>
        </Link>

        <form
          role="search"
          onSubmit={handleSearch}
          className="ml-auto min-w-0 flex-1 sm:ml-4 sm:max-w-md"
        >
          <label htmlFor="global-search" className="sr-only">
            Search communities
          </label>
          <input
            id="global-search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search communities…"
            className="hh-input h-9 py-1.5"
          />
        </form>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
        </button>

        <Link
          to="/notifications"
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-lg text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
        >
          <span aria-hidden="true">🔔</span>
          <span className="sr-only">
            Notifications{unreadCount > 0 ? ` (${unreadCount} unread)` : ''}
          </span>
          {unreadCount > 0 && (
            <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-error px-1 text-[10px] font-semibold leading-4 text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex items-center gap-2 rounded-lg p-0.5 transition-colors hover:bg-surface-muted"
          >
            <Avatar name={user?.name} src={user?.avatarUrl} size="sm" />
            <span className="sr-only">Account menu</span>
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-56 animate-slide-up overflow-hidden rounded-card border border-line bg-surface shadow-pop"
            >
              <div className="border-b border-line px-3 py-2.5">
                <p className="truncate text-sm font-medium">{user?.name}</p>
                <p className="truncate text-xs text-ink-subtle">{user?.email}</p>
              </div>

              <div className="py-1 md:hidden">
                {menuItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    role="menuitem"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
                  >
                    <span aria-hidden="true">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="hidden py-1 md:block">
                <Link
                  to="/settings"
                  role="menuitem"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
                >
                  <span aria-hidden="true">⚙️</span> Settings
                </Link>
              </div>

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  logout().then(() => navigate('/login'));
                }}
                className="flex w-full items-center gap-2.5 border-t border-line px-3 py-2 text-left text-sm text-error hover:bg-error-soft"
              >
                <span aria-hidden="true">↪</span> Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
