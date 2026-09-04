/**
 * features/communities/MemberList.jsx — member roster and the moderator queue.
 *
 * Moderators get approve/reject controls on pending requests; community admins can
 * also change roles and remove people (phases.doc.md Phase 4).
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../../components/ui/Avatar';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import EmptyState, { ErrorState } from '../../components/ui/EmptyState';
import Pagination from '../../components/ui/Pagination';
import { LoadingPanel } from '../../components/ui/Spinner';
import Tabs from '../../components/ui/Tabs';
import { useToast } from '../../context/ToastContext';
import usePaginatedList from '../../hooks/usePaginatedList';
import * as communityService from '../../services/communityService';
import { formatRelative } from '../../utils/format';
import { COMMUNITY_ROLE_LABELS } from '../../utils/constants';

const ROLE_OPTIONS = [
  { value: 'member', label: 'Member' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'admin', label: 'Community admin' },
];

export default function MemberList({ community, canModerate, canManageRoles }) {
  const toast = useToast();
  const [tab, setTab] = useState('approved');
  const [pendingRemoval, setPendingRemoval] = useState(null);

  const key = community.slug || community._id;
  const list = usePaginatedList((params) => communityService.listMembers(key, params), {
    initialFilters: { status: 'approved' },
  });

  const switchTab = (next) => {
    setTab(next);
    list.applyFilters({ status: next });
  };

  const review = async (membership, action) => {
    try {
      await communityService.reviewMember(key, membership._id, action);
      list.removeItem(membership._id);
      toast.success(
        action === 'approve' ? `${membership.user?.name} is now a member` : 'Request declined',
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  const changeRole = async (membership, role) => {
    try {
      const result = await communityService.setMemberRole(key, membership._id, role);
      list.patchItem(membership._id, { role: result.role });
      toast.success(
        `${membership.user?.name} is now a ${COMMUNITY_ROLE_LABELS[result.role].toLowerCase()}`,
      );
    } catch (error) {
      toast.error(error.message);
    }
  };

  const removeMember = async () => {
    const { membership, ban } = pendingRemoval;
    try {
      await communityService.removeMember(key, membership._id, ban);
      list.removeItem(membership._id);
      toast.success(ban ? 'Member banned from this community' : 'Member removed');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const tabs = [
    { value: 'approved', label: 'Members' },
    ...(canModerate ? [{ value: 'pending', label: 'Requests' }] : []),
    ...(canModerate ? [{ value: 'banned', label: 'Banned' }] : []),
  ];

  return (
    <div className="hh-card overflow-hidden">
      <Tabs tabs={tabs} value={tab} onChange={switchTab} label="Member lists" />

      {list.isLoading && <LoadingPanel label="Loading members" />}
      {list.error && <ErrorState error={list.error} onRetry={list.reload} />}

      {list.isEmpty && (
        <EmptyState
          icon={tab === 'pending' ? '📭' : '👥'}
          title={tab === 'pending' ? 'No requests waiting' : `No ${tab} members`}
          description={
            tab === 'pending'
              ? 'Join requests will appear here for you to review.'
              : 'Nobody here yet.'
          }
        />
      )}

      <ul className="divide-y divide-line">
        {list.items.map((membership) => {
          const member = membership.user || {};
          return (
            <li key={membership._id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Avatar name={member.name} src={member.avatarUrl} size="md" />

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  <Link
                    to={`/profile/${member._id}`}
                    className="hover:text-primary hover:underline"
                  >
                    {member.name || 'Unknown member'}
                  </Link>
                </p>
                <p className="truncate text-xs text-ink-subtle">
                  {member.hometown?.city ? `${member.hometown.city} · ` : ''}
                  joined {formatRelative(membership.joinedAt || membership.createdAt)}
                </p>
                {membership.joinMessage && (
                  <p className="mt-1 rounded-lg bg-surface-muted px-2 py-1 text-xs text-ink-muted">
                    “{membership.joinMessage}”
                  </p>
                )}
              </div>

              {membership.role !== 'member' && membership.status === 'approved' && (
                <Badge tone="primary">{COMMUNITY_ROLE_LABELS[membership.role]}</Badge>
              )}

              {tab === 'pending' && canModerate && (
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => review(membership, 'approve')}>
                    Approve
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => review(membership, 'reject')}>
                    Decline
                  </Button>
                </div>
              )}

              {tab === 'approved' && canManageRoles && (
                <div className="flex items-center gap-2">
                  <label className="sr-only" htmlFor={`role-${membership._id}`}>
                    Role for {member.name}
                  </label>
                  <select
                    id={`role-${membership._id}`}
                    value={membership.role}
                    onChange={(event) => changeRole(membership, event.target.value)}
                    className="hh-input h-8 w-auto py-0 text-sm"
                  >
                    {ROLE_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setPendingRemoval({ membership, ban: false })}
                    className="text-error hover:bg-error-soft"
                  >
                    Remove
                  </Button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      <Pagination meta={list.meta} page={list.page} onChange={list.setPage} />

      <ConfirmDialog
        isOpen={Boolean(pendingRemoval)}
        onClose={() => setPendingRemoval(null)}
        onConfirm={removeMember}
        title="Remove this member?"
        message={`${pendingRemoval?.membership?.user?.name || 'This person'} will lose access to this community. They can request to join again unless you ban them.`}
        confirmLabel="Remove member"
      />
    </div>
  );
}
