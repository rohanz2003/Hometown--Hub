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
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <ul className="flex">
        {items.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                [
                  'flex h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-ink-subtle hover:text-ink',
                ].join(' ')
              }
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {item.icon}
              </span>
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
