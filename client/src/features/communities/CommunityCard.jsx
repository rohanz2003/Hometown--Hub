/**
 * features/communities/CommunityCard.jsx — one community in the directory.
 *
 * The action button reflects the viewer's membership state, so the same card
 * works for a member, an applicant, and a stranger.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import * as communityService from '../../services/communityService';
import { formatCount, formatLocation, mediaUrl, truncate } from '../../utils/format';
import { COMMUNITY_ROLE_LABELS, COMMUNITY_STATUS_LABELS } from '../../utils/constants';

export default function CommunityCard({ community, onPatch, view = 'list' }) {
  const toast = useToast();
  const [isBusy, setIsBusy] = useState(false);

  const href = `/communities/${community.slug || community._id}`;
  const isMember = community.myStatus === 'approved';
  const isPending = community.myStatus === 'pending';

  const handleJoin = async () => {
    setIsBusy(true);
    try {
      const result = await communityService.joinCommunity(community.slug || community._id);
      onPatch?.(community._id, { myStatus: result.status, myRole: result.role });
      toast.success(result.message);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <article
      className={`hh-card flex overflow-hidden ${view === 'grid' ? 'flex-col' : 'flex-col sm:flex-row'}`}
    >
      {community.coverImageUrl ? (
        <img
          src={mediaUrl(community.coverImageUrl)}
          alt={`${community.name} cover`}
          loading="lazy"
          className={
            view === 'grid'
              ? 'h-28 w-full object-cover'
              : 'h-28 w-full object-cover sm:h-auto sm:w-40'
          }
        />
      ) : (
        <div
          aria-hidden="true"
          className={`grid place-items-center bg-primary-soft text-2xl ${
            view === 'grid' ? 'h-20 w-full' : 'h-20 w-full sm:h-auto sm:w-24'
          }`}
        >
          🏘️
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold">
              <Link to={href} className="hover:text-primary hover:underline">
                {community.name}
              </Link>
            </h3>
            <p className="truncate text-sm text-ink-subtle">
              📍 {formatLocation(community.location)}
            </p>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1">
            {community.myRole && community.myRole !== 'member' && (
              <Badge tone="primary">{COMMUNITY_ROLE_LABELS[community.myRole]}</Badge>
            )}
            {community.status && community.status !== 'approved' && (
              <Badge tone={community.status === 'pending' ? 'warning' : 'error'}>
                {COMMUNITY_STATUS_LABELS[community.status]}
              </Badge>
            )}
          </div>
        </div>

        {community.description && (
          <p className="mt-2 text-sm text-ink-muted">{truncate(community.description, 140)}</p>
        )}

        <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-subtle">
          <div className="flex gap-1">
            <dt>Members</dt>
            <dd className="font-medium text-ink-muted">{formatCount(community.memberCount)}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Posts</dt>
            <dd className="font-medium text-ink-muted">{formatCount(community.postCount)}</dd>
          </div>
          <div className="flex gap-1">
            <dt>Events</dt>
            <dd className="font-medium text-ink-muted">{formatCount(community.eventCount)}</dd>
          </div>
        </dl>

        <div className="mt-3 flex items-center gap-2 pt-1">
          <Button as={Link} to={href} size="sm" variant="outline">
            View
          </Button>

          {isMember ? (
            <Badge tone="success">✓ Joined</Badge>
          ) : isPending ? (
            <Badge tone="warning">Awaiting approval</Badge>
          ) : (
            <Button size="sm" onClick={handleJoin} isLoading={isBusy}>
              {community.requiresApproval || community.visibility === 'private'
                ? 'Request to join'
                : 'Join'}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
