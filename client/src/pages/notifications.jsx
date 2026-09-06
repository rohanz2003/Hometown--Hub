/**
 * pages/notifications.jsx — the in-app notification inbox (Phase 4).
 */
import { Link, useOutletContext } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { LoadingPanel } from '../components/ui/Spinner';
import Tabs from '../components/ui/Tabs';
import { useToast } from '../context/ToastContext';
import usePaginatedList from '../hooks/usePaginatedList';
import * as userService from '../services/userService';
import { formatRelative } from '../utils/format';
import { NotificationsIcon as BellIcon, CloseIcon } from '../components/ui/icons';

const TABS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
];

export default function NotificationsPage() {
  const toast = useToast();
  const { refreshUnread } = useOutletContext() || {};

  const list = usePaginatedList((query) => userService.listNotifications(query), {
    initialFilters: {},
    pageSize: 20,
  });

  const activeTab = list.filters.unreadOnly === 'true' ? 'unread' : 'all';

  const switchTab = (tab) =>
    list.applyFilters({ unreadOnly: tab === 'unread' ? 'true' : undefined });

  const markRead = async (notification) => {
    if (notification.isRead) return;
    try {
      await userService.markNotificationRead(notification._id);
      list.patchItem(notification._id, { isRead: true });
      refreshUnread?.();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const markAllRead = async () => {
    try {
      const result = await userService.markAllNotificationsRead();
      list.reload();
      refreshUnread?.();
      toast.success(
        result.updated > 0 ? 'All notifications marked as read' : 'Nothing left to read',
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  const dismiss = async (notification) => {
    try {
      await userService.dismissNotification(notification._id);
      list.removeItem(notification._id);
      refreshUnread?.();
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Approvals, replies, reminders, and community news.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Mark all as read
        </Button>
      </header>

      <Tabs tabs={TABS} value={activeTab} onChange={switchTab} label="Notification filters" />

      <Card className="overflow-hidden">
        {list.isLoading && <LoadingPanel label="Loading notifications" />}
        {list.error && <ErrorState error={list.error} onRetry={list.reload} />}

        {list.isEmpty && (
          <EmptyState
            icon="bell"
            title={activeTab === 'unread' ? 'Nothing unread' : 'No notifications yet'}
            description="When something happens in your communities, it shows up here."
          />
        )}

        <ul className="divide-y divide-line">
          {list.items.map((notification) => {
            const Wrapper = notification.link ? Link : 'div';
            return (
              <li
                key={notification._id}
                className={`flex items-start gap-3 px-4 py-3 ${notification.isRead ? '' : 'bg-primary-soft/40'}`}
              >
                <BellIcon
                  aria-hidden="true"
                  className={`mt-0.5 h-5 w-5 flex-shrink-0 ${
                    notification.isRead ? 'text-ink-subtle' : 'text-primary'
                  }`}
                  strokeWidth={2}
                />

                <Wrapper
                  {...(notification.link ? { to: notification.link } : {})}
                  onClick={() => markRead(notification)}
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="text-sm text-ink">{notification.message}</p>
                  <p className="mt-0.5 text-xs text-ink-subtle">
                    {notification.community?.name ? `${notification.community.name} · ` : ''}
                    <time dateTime={notification.createdAt}>
                      {formatRelative(notification.createdAt)}
                    </time>
                  </p>
                </Wrapper>

                <div className="flex shrink-0 items-center gap-1">
                  {!notification.isRead && (
                    <button
                      type="button"
                      onClick={() => markRead(notification)}
                      className="rounded px-2 py-1 text-xs font-medium text-primary hover:bg-primary-soft"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dismiss(notification)}
                    aria-label="Dismiss this notification"
                    className="rounded p-1 text-ink-subtle hover:bg-surface-muted hover:text-error"
                  >
                    <CloseIcon className="h-4 w-4" strokeWidth={2} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <Pagination meta={list.meta} page={list.page} onChange={list.setPage} />
      </Card>
    </div>
  );
}
