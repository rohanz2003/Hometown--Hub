/**
 * pages/admin.jsx — the platform admin dashboard (Phase 4 deliverable).
 *
 * Four jobs in one screen: platform KPIs, the community approval queue, user and
 * moderator management, and the shared category list.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { Input, Select, Textarea } from '../components/ui/Field';
import { LoadingPanel } from '../components/ui/Spinner';
import StatCard from '../components/ui/StatCard';
import Tabs, { TabPanel } from '../components/ui/Tabs';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import useAsync from '../hooks/useAsync';
import useDebounce from '../hooks/useDebounce';
import usePaginatedList from '../hooks/usePaginatedList';
import * as adminService from '../services/adminService';
import { formatDate, formatLocation, formatRelative } from '../utils/format';
import { COMMUNITY_STATUS_LABELS } from '../utils/constants';
import {
  MembersIcon as UsersIcon,
  ZapIcon,
  CommunityIcon as BuildingIcon,
  TimeIcon as ClockIcon,
  PostIcon as FileTextIcon,
  CommentIcon as MessageSquareIcon,
  EventsIcon as CalendarIcon,
  ReportIcon as FlagIcon,
} from '../components/ui/icons';

export default function AdminPage() {
  const [tab, setTab] = useState('overview');

  const tabs = [
    { value: 'overview', label: 'Overview' },
    { value: 'communities', label: 'Communities' },
    { value: 'users', label: 'Users' },
    { value: 'categories', label: 'Categories' },
  ];

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Platform admin</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Approve communities, manage people, and keep an eye on platform health.
        </p>
      </header>

      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Admin sections" />

      <TabPanel value="overview" active={tab}>
        <Overview />
      </TabPanel>
      <TabPanel value="communities" active={tab}>
        <CommunityQueue />
      </TabPanel>
      <TabPanel value="users" active={tab}>
        <UserManagement />
      </TabPanel>
      <TabPanel value="categories" active={tab}>
        <CategoryManagement />
      </TabPanel>
    </div>
  );
}

/* ── Overview ──────────────────────────────────────────────────────────────── */

function Overview() {
  const { data, error, isLoading, reload } = useAsync(() => adminService.getStats(), []);

  if (isLoading) return <LoadingPanel label="Loading platform stats" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Registered users"
          value={data.users}
          icon={UsersIcon}
          hint={`${data.newUsers} joined this week`}
        />
        <StatCard
          label="Active this week"
          value={data.activeUsers}
          icon={ZapIcon}
          accent="secondary"
          hint="Signed in within 7 days"
        />
        <StatCard
          label="Live communities"
          value={data.communities}
          icon={BuildingIcon}
          accent="accent"
        />
        <StatCard
          label="Awaiting review"
          value={data.pendingCommunities}
          icon={ClockIcon}
          accent="muted"
          hint={data.pendingCommunities > 0 ? 'Needs your attention' : 'Queue is clear'}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Posts" value={data.posts} icon={FileTextIcon} />
        <StatCard
          label="Comments"
          value={data.comments}
          icon={MessageSquareIcon}
          accent="secondary"
        />
        <StatCard label="Events" value={data.events} icon={CalendarIcon} accent="accent" />
        <StatCard
          label="Open reports"
          value={data.openReports}
          icon={FlagIcon}
          accent="muted"
          to="/moderation"
        />
      </div>

      <Card>
        <CardHeader
          title="Engagement"
          description="Comments per post across the platform — the headline engagement KPI."
        />
        <CardBody>
          <p className="text-3xl font-semibold tabular-nums">{data.engagementRate}</p>
          <p className="mt-1 text-sm text-ink-muted">
            {data.comments} comments across {data.posts} posts.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}

/* ── Community approval queue ──────────────────────────────────────────────── */

function CommunityQueue() {
  const toast = useToast();
  const [reviewing, setReviewing] = useState(null);
  const [note, setNote] = useState('');

  const list = usePaginatedList((query) => adminService.listCommunities(query), {
    initialFilters: { status: 'pending' },
  });

  const review = async (action) => {
    try {
      await adminService.reviewCommunity(reviewing._id, action, note);
      list.removeItem(reviewing._id);
      toast.success(
        action === 'approve' ? 'Community approved and now live' : `Community ${action}d`,
      );
      setReviewing(null);
      setNote('');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const statusTabs = [
    { value: 'pending', label: 'Pending' },
    { value: 'approved', label: 'Live' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'suspended', label: 'Suspended' },
  ];

  return (
    <div className="space-y-4">
      <Tabs
        tabs={statusTabs}
        value={list.filters.status}
        onChange={(status) => list.applyFilters({ status })}
        label="Community statuses"
      />

      <Card className="overflow-hidden">
        {list.isLoading && <LoadingPanel label="Loading communities" />}
        {list.error && <ErrorState error={list.error} onRetry={list.reload} />}

        {list.isEmpty && (
          <EmptyState
            icon="check-circle"
            title={`No ${list.filters.status} communities`}
            description={
              list.filters.status === 'pending'
                ? 'The approval queue is clear.'
                : 'Nothing in this list.'
            }
          />
        )}

        <ul className="divide-y divide-line">
          {list.items.map((community) => (
            <li
              key={community._id}
              className="flex flex-wrap items-start justify-between gap-3 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="truncate text-sm font-medium">
                    <Link
                      to={`/communities/${community.slug}`}
                      className="hover:text-primary hover:underline"
                    >
                      {community.name}
                    </Link>
                  </h3>
                  <Badge
                    tone={
                      community.status === 'approved'
                        ? 'success'
                        : community.status === 'pending'
                          ? 'warning'
                          : 'error'
                    }
                  >
                    {COMMUNITY_STATUS_LABELS[community.status]}
                  </Badge>
                </div>

                <p className="mt-0.5 text-xs text-ink-subtle">
                  📍 {formatLocation(community.location)} · created by{' '}
                  {community.createdBy?.name || 'unknown'} · {formatRelative(community.createdAt)}
                </p>

                {community.description && (
                  <p className="mt-1.5 text-sm text-ink-muted">{community.description}</p>
                )}

                {community.reviewNote && (
                  <p className="mt-1 text-xs text-ink-subtle">
                    Review note: {community.reviewNote}
                  </p>
                )}
              </div>

              <Button
                size="sm"
                variant={community.status === 'pending' ? 'primary' : 'outline'}
                onClick={() => setReviewing(community)}
              >
                Review
              </Button>
            </li>
          ))}
        </ul>

        <Pagination meta={list.meta} page={list.page} onChange={list.setPage} />
      </Card>

      <Modal
        isOpen={Boolean(reviewing)}
        onClose={() => setReviewing(null)}
        title={reviewing?.name || 'Review community'}
        description="Approving makes it visible in the public directory. The creator is notified either way."
        size="sm"
        footer={
          <>
            {reviewing?.status === 'approved' ? (
              <Button variant="danger" onClick={() => review('suspend')}>
                Suspend
              </Button>
            ) : (
              <Button variant="outline" onClick={() => review('reject')}>
                Reject
              </Button>
            )}
            <Button
              onClick={() => review(reviewing?.status === 'approved' ? 'reinstate' : 'approve')}
            >
              {reviewing?.status === 'approved' ? 'Keep live' : 'Approve'}
            </Button>
          </>
        }
      >
        <Textarea
          label="Note to the creator (optional)"
          placeholder="Why are you approving or rejecting this?"
          rows={3}
          value={note}
          onChange={(event) => setNote(event.target.value)}
        />
      </Modal>
    </div>
  );
}

/* ── User management ───────────────────────────────────────────────────────── */

function UserManagement() {
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [pendingAction, setPendingAction] = useState(null);
  const debouncedSearch = useDebounce(search);

  const list = usePaginatedList((query) => adminService.listUsers(query), { initialFilters: {} });
  const { applyFilters } = list;

  // Push the debounced search into the query once typing settles.
  useEffect(() => {
    applyFilters({ q: debouncedSearch || undefined });
  }, [debouncedSearch, applyFilters]);

  const setRole = async (target, role) => {
    try {
      await adminService.setUserRole(target.id, role);
      list.patchItem(target.id, { role });
      toast.success(
        `${target.name} is now ${role === 'platform_admin' ? 'a platform admin' : 'a regular user'}`,
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  const applyActiveChange = async () => {
    const { target, isActive } = pendingAction;
    try {
      await adminService.setUserActive(target.id, isActive);
      list.patchItem(target.id, { isActive });
      toast.success(isActive ? `${target.name} restored` : `${target.name} deactivated`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="px-4 py-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="user-search" className="hh-label">
              Search
            </label>
            <input
              id="user-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Name, email, or city…"
              className="hh-input"
            />
          </div>
          <Select
            label="Role"
            placeholder="Any role"
            value={list.filters.role || ''}
            onChange={(event) => applyFilters({ role: event.target.value || undefined })}
            options={[
              { value: 'user', label: 'Users' },
              { value: 'platform_admin', label: 'Platform admins' },
            ]}
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {list.isLoading && <LoadingPanel label="Loading users" />}
        {list.error && <ErrorState error={list.error} onRetry={list.reload} />}
        {list.isEmpty && (
          <EmptyState icon="users" title="No users found" description="Try a different search." />
        )}

        <ul className="divide-y divide-line">
          {list.items.map((row) => {
            const isSelf = row.id === currentUser?.id;
            return (
              <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm font-medium">
                    <Link
                      to={`/profile/${row.id}`}
                      className="truncate hover:text-primary hover:underline"
                    >
                      {row.name}
                    </Link>
                    {row.role === 'platform_admin' && <Badge tone="primary">Platform admin</Badge>}
                    {!row.isActive && <Badge tone="error">Deactivated</Badge>}
                    {isSelf && <Badge>You</Badge>}
                  </p>
                  <p className="truncate text-xs text-ink-subtle">
                    {row.email} · {row.communityCount} communities · joined{' '}
                    {formatDate(row.createdAt)}
                    {row.lastLoginAt && ` · last seen ${formatRelative(row.lastLoginAt)}`}
                  </p>
                </div>

                {!isSelf && (
                  <div className="flex items-center gap-2">
                    <label className="sr-only" htmlFor={`role-${row.id}`}>
                      Platform role for {row.name}
                    </label>
                    <select
                      id={`role-${row.id}`}
                      value={row.role}
                      onChange={(event) => setRole(row, event.target.value)}
                      className="hh-input h-8 w-auto py-0 text-sm"
                    >
                      <option value="user">User</option>
                      <option value="platform_admin">Platform admin</option>
                    </select>

                    <Button
                      size="sm"
                      variant={row.isActive ? 'ghost' : 'outline'}
                      className={row.isActive ? 'text-error hover:bg-error-soft' : ''}
                      onClick={() => setPendingAction({ target: row, isActive: !row.isActive })}
                    >
                      {row.isActive ? 'Deactivate' : 'Restore'}
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <Pagination meta={list.meta} page={list.page} onChange={list.setPage} />
      </Card>

      <ConfirmDialog
        isOpen={Boolean(pendingAction)}
        onClose={() => setPendingAction(null)}
        onConfirm={applyActiveChange}
        title={pendingAction?.isActive ? 'Restore this account?' : 'Deactivate this account?'}
        message={
          pendingAction?.isActive
            ? `${pendingAction?.target?.name} will be able to sign in again.`
            : `${pendingAction?.target?.name} will be signed out and unable to sign in. Their posts stay in place.`
        }
        confirmLabel={pendingAction?.isActive ? 'Restore account' : 'Deactivate account'}
        tone={pendingAction?.isActive ? 'primary' : 'danger'}
      />
    </div>
  );
}

/* ── Categories ────────────────────────────────────────────────────────────── */

function CategoryManagement() {
  const toast = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const { data, error, isLoading, reload } = useAsync(() => adminService.listAllCategories(), []);

  const create = async () => {
    try {
      await adminService.createCategory({ name });
      setName('');
      setIsCreating(false);
      reload();
      toast.success('Category added');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const toggleActive = async (category) => {
    try {
      if (category.isActive) await adminService.deactivateCategory(category._id);
      else await adminService.updateCategory(category._id, { isActive: true });
      reload();
      toast.success(category.isActive ? 'Category retired' : 'Category reactivated');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Content categories"
        description="Members pick these when posting or creating an event."
        actions={
          <Button size="sm" onClick={() => setIsCreating(true)}>
            Add category
          </Button>
        }
      />

      {isLoading && <LoadingPanel label="Loading categories" />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {data?.length === 0 && (
        <EmptyState
          icon="tag"
          title="No categories yet"
          description="Add a few so members can file their posts."
          action={<Button onClick={() => setIsCreating(true)}>Add the first category</Button>}
        />
      )}

      <ul className="divide-y divide-line">
        {(data || []).map((category) => (
          <li key={category._id} className="flex items-center justify-between gap-3 px-4 py-3">
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium">
                {category.name}
                {!category.isActive && <Badge>Retired</Badge>}
              </p>
              <p className="text-xs text-ink-subtle">Applies to: {category.appliesTo.join(', ')}</p>
            </div>
            <Button size="sm" variant="outline" onClick={() => toggleActive(category)}>
              {category.isActive ? 'Retire' : 'Reactivate'}
            </Button>
          </li>
        ))}
      </ul>

      <Modal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Add a category"
        size="sm"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button onClick={create} disabled={name.trim().length < 2}>
              Add category
            </Button>
          </>
        }
      >
        <Input
          label="Category name"
          placeholder="e.g. Festivals & Culture"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </Modal>
    </Card>
  );
}
