/**
 * components/layout/MobileNav.jsx — bottom tab bar for phones.
 *
 * Mobile-first (design.md § 1): the four most-used destinations sit within thumb
 * reach, with 44px-tall touch targets.
 */
import { NavLink } from 'react-router-dom';
import { NAV_ITEMS } from './navItems';

export default function MobileNav() {
  const items = NAV_ITEMS.filter((item) => item.mobile);

  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  [
                    'flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-ink-subtle hover:text-ink',
                  ].join(' ')
                }
              >
                <Icon aria-hidden="true" className="h-6 w-6 leading-none" strokeWidth={2.5} />
                {item.label}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
