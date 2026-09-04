/**
 * components/layout/AppLayout.jsx — the shell every signed-in screen renders into.
 *
 * Owns the unread-notification count so the navbar badge and the sidebar badge
 * always agree, and refreshes it on navigation.
 */
import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import { useAuth } from '../../context/AuthContext';
import * as userService from '../../services/userService';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnread = useCallback(() => {
    if (!isAuthenticated) return;
    userService
      .unreadCount()
      .then((result) => setUnreadCount(result.unreadCount ?? 0))
      // A failed badge count is not worth interrupting the user for.
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread, location.pathname]);

  return (
    <div className="min-h-screen bg-canvas">
      <a href="#main-content" className="hh-skip-link">
        Skip to main content
      </a>

      <Navbar unreadCount={unreadCount} />

      <div className="flex">
        <Sidebar unreadCount={unreadCount} />

        <main
          id="main-content"
          className="min-w-0 flex-1 px-3 pb-20 pt-4 sm:px-5 sm:pb-8 lg:px-8"
          tabIndex={-1}
        >
          <div className="mx-auto w-full max-w-4xl">
            <Outlet context={{ refreshUnread }} />
          </div>
        </main>
      </div>

      <MobileNav />
    </div>
  );
}
