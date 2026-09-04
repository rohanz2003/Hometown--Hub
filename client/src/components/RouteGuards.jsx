/**
 * components/RouteGuards.jsx — route-level access control.
 *
 * Mirrors the backend's role checks so the UI never renders a screen the API
 * would refuse, and remembers where the user was heading before signing in.
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingPanel } from './ui/Spinner';

/** Requires a signed-in user. */
export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingPanel label="Checking your session" className="min-h-screen" />;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}

/** Requires the platform-admin role. */
export function PlatformAdminRoute() {
  const { isAuthenticated, isPlatformAdmin, isLoading } = useAuth();

  if (isLoading) return <LoadingPanel label="Checking your permissions" className="min-h-screen" />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isPlatformAdmin) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}

/** Sends an already-signed-in visitor away from the login/register screens. */
export function PublicOnlyRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <LoadingPanel label="Loading" className="min-h-screen" />;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  return <Outlet />;
}
