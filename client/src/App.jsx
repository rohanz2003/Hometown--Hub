/**
 * App.jsx — route table and provider stack.
 *
 * Provider order matters: toasts are outermost so auth can report a lost session,
 * and the theme reads the signed-in user's saved preference.
 */
import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout';
import AuthLayout from './components/layout/AuthLayout';
import { PlatformAdminRoute, ProtectedRoute, PublicOnlyRoute } from './components/RouteGuards';
import ToastViewport from './components/ui/ToastViewport';
import { LoadingPanel } from './components/ui/Spinner';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

/* Auth screens load eagerly — they are the entry point for most visits. */
import LoginPage from './pages/login';
import RegisterPage from './pages/register';
import ForgotPasswordPage from './pages/forgot-password';
import ResetPasswordPage from './pages/reset-password';
import LandingPage from './pages/landing';
import NotFoundPage from './pages/not-found';

/* The signed-in app is split out so the first paint stays small. */
const DashboardPage = lazy(() => import('./pages/dashboard'));
const FeedPage = lazy(() => import('./pages/feed'));
const CommunitiesPage = lazy(() => import('./pages/communities'));
const CommunityDetailPage = lazy(() => import('./pages/community-detail'));
const PostDetailPage = lazy(() => import('./pages/post-detail'));
const EventsPage = lazy(() => import('./pages/events'));
const EventDetailPage = lazy(() => import('./pages/event-detail'));
const NotificationsPage = lazy(() => import('./pages/notifications'));
const ProfilePage = lazy(() => import('./pages/profile'));
const SettingsPage = lazy(() => import('./pages/settings'));
const ModerationPage = lazy(() => import('./pages/moderation'));
const AdminPage = lazy(() => import('./pages/admin'));

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <ThemeProvider>
          <Suspense fallback={<LoadingPanel label="Loading" className="min-h-screen" />}>
            <Routes>
              <Route path="/" element={<LandingPage />} />

              {/* Signed-out only */}
              <Route element={<PublicOnlyRoute />}>
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                </Route>
              </Route>

              {/* Signed-in app */}
              <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/feed" element={<FeedPage />} />
                  <Route path="/communities" element={<CommunitiesPage />} />
                  <Route path="/communities/:communityId" element={<CommunityDetailPage />} />
                  <Route path="/posts/:postId" element={<PostDetailPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/events/:eventId" element={<EventDetailPage />} />
                  <Route path="/notifications" element={<NotificationsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/profile/:userId" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/moderation" element={<ModerationPage />} />

                  <Route element={<PlatformAdminRoute />}>
                    <Route path="/admin" element={<AdminPage />} />
                  </Route>

                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Route>

              <Route path="/home" element={<Navigate to="/dashboard" replace />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>

          <ToastViewport />
        </ThemeProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
