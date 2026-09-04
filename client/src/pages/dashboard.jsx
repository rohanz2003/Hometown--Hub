/**
 * pages/dashboard.jsx — Phase 2 overview.
 *
 * One request feeds the whole screen: KPI tiles, the activity chart, the user's
 * communities, upcoming events, and recent notifications.
 */
import { Link } from 'react-router-dom';
import ActivityChart from '../components/ui/ActivityChart';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import { LoadingPanel } from '../components/ui/Spinner';
import StatCard from '../components/ui/StatCard';
import { useAuth } from '../context/AuthContext';
import useAsync from '../hooks/useAsync';
import * as dashboardService from '../services/dashboardService';
import { formatEventWindow, formatLocation, formatRelative } from '../utils/format';
import { COMMUNITY_ROLE_LABELS, NOTIFICATION_ICONS } from '../utils/constants';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data, error, isLoading, reload } = useAsync(() => dashboardService.getSummary(), []);

  if (isLoading) return <LoadingPanel label="Loading your dashboard" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const { stats, communities, upcomingEvents, notifications, activity } = data;
  const firstName = user?.name?.split(' ')[0] || 'there';

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Hello, {firstName}</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          {stats.communities === 0
            ? "You haven't joined a community yet — let's fix that."
            : `Here's what's happening across your ${stats.communities === 1 ? 'community' : `${stats.communities} communities`}.`}
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Communities"
          value={stats.communities}
          icon="🏘️"
          to="/communities"
          accent="primary"
        />
        <StatCard
          label="Upcoming events"
          value={stats.upcomingEvents}
          icon="📅"
          to="/events"
          accent="accent"
        />
        <StatCard
          label="Unread notifications"
          value={stats.unreadNotifications}
          icon="🔔"
          to="/notifications"
          accent="secondary"
        />
        <StatCard
          label="Your posts"
          value={stats.myPosts}
          icon="✍️"
          hint={`${stats.likesReceived} ${stats.likesReceived === 1 ? 'like' : 'likes'} received`}
          accent="muted"
        />
      </div>

      <Card>
        <CardBody>
          <ActivityChart data={activity} />
        </CardBody>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Your communities"
            actions={
              <Button as={Link} to="/communities" size="sm" variant="ghost">
                See all
              </Button>
            }
          />
          {communities.length === 0 ? (
            <EmptyState
              icon="🏘️"
              title="No communities yet"
              description="Find your hometown, or start a new community for it."
              action={
                <Button as={Link} to="/communities">
                  Browse communities
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {communities.map((community) => (
                <li key={community._id}>
                  <Link
                    to={`/communities/${community.slug}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-9 w-9 place-items-center rounded-lg bg-primary-soft"
                    >
                      🏘️
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{community.name}</span>
                      <span className="block truncate text-xs text-ink-subtle">
                        {formatLocation(community.location)} · {community.memberCount} members
                      </span>
                    </span>
                    {community.myRole && community.myRole !== 'member' && (
                      <Badge tone="primary">{COMMUNITY_ROLE_LABELS[community.myRole]}</Badge>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            title="Upcoming events"
            actions={
              <Button as={Link} to="/events" size="sm" variant="ghost">
                See all
              </Button>
            }
          />
          {upcomingEvents.length === 0 ? (
            <EmptyState
              icon="📅"
              title="Nothing scheduled"
              description="When your communities plan something, it will show up here."
            />
          ) : (
            <ul className="divide-y divide-line">
              {upcomingEvents.map((event) => (
                <li key={event._id}>
                  <Link
                    to={`/events/${event._id}`}
                    className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-surface-muted"
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-9 w-9 place-items-center rounded-lg bg-accent-soft"
                    >
                      📅
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{event.title}</span>
                      <span className="block truncate text-xs text-accent">
                        {formatEventWindow(event)}
                      </span>
                      <span className="block truncate text-xs text-ink-subtle">
                        {event.community?.name} · {event.goingCount} going
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Recent notifications"
          actions={
            <Button as={Link} to="/notifications" size="sm" variant="ghost">
              See all
            </Button>
          }
        />
        {notifications.length === 0 ? (
          <EmptyState
            icon="🔔"
            title="Nothing new"
            description="Activity in your communities shows up here."
          />
        ) : (
          <ul className="divide-y divide-line">
            {notifications.map((notification) => (
              <li
                key={notification._id}
                className={`flex items-start gap-3 px-4 py-3 ${notification.isRead ? '' : 'bg-primary-soft/40'}`}
              >
                <span aria-hidden="true" className="text-base">
                  {NOTIFICATION_ICONS[notification.type] || '🔔'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">{notification.message}</p>
                  <p className="text-xs text-ink-subtle">
                    {formatRelative(notification.createdAt)}
                  </p>
                </div>
                {!notification.isRead && (
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary"
                    aria-label="Unread"
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
