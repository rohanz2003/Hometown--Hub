/**
 * pages/community-detail.jsx — a single community: posts, events, members, about.
 *
 * The visible tabs and actions depend on the viewer's role, mirroring the
 * permissions the API enforces.
 */
import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { LoadingPanel } from '../components/ui/Spinner';
import Tabs, { TabPanel } from '../components/ui/Tabs';
import CommunityForm from '../features/communities/CommunityForm';
import MemberList from '../features/communities/MemberList';
import EventCard from '../features/events/EventCard';
import EventForm from '../features/events/EventForm';
import PostCard from '../features/posts/PostCard';
import PostComposer from '../features/posts/PostComposer';
import { useToast } from '../context/ToastContext';
import useAsync from '../hooks/useAsync';
import usePaginatedList from '../hooks/usePaginatedList';
import * as communityService from '../services/communityService';
import * as dashboardService from '../services/dashboardService';
import * as eventService from '../services/eventService';
import * as postService from '../services/postService';
import { formatCount, formatLocation, mediaUrl } from '../utils/format';
import { COMMUNITY_ROLE_LABELS, COMMUNITY_STATUS_LABELS } from '../utils/constants';
import {
  CommunityIcon as BuildingIcon,
  PrivateIcon as LockIcon,
  MapPinIcon,
  FeedIcon as NewspaperIcon,
  EventsIcon as CalendarIcon,
} from '../components/ui/icons';

export default function CommunityDetailPage() {
  const { communityId } = useParams();
  const [params, setParams] = useSearchParams();
  const toast = useToast();

  const [tab, setTab] = useState(params.get('tab') || 'posts');
  const [isEditing, setIsEditing] = useState(false);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const community = useAsync(() => communityService.getCommunity(communityId), [communityId]);
  const { data: categories } = useAsync(() => dashboardService.listCategories(), []);

  const { data } = community;
  const isMember = data?.myStatus === 'approved';
  const canModerate = ['moderator', 'admin'].includes(data?.myRole);
  const canManage = data?.myRole === 'admin';

  const posts = usePaginatedList((query) => postService.listByCommunity(communityId, query), {
    initialFilters: { sort: 'recent' },
  });
  const events = usePaginatedList((query) => eventService.listByCommunity(communityId, query), {
    initialFilters: { when: 'upcoming' },
  });

  const switchTab = (next) => {
    setTab(next);
    setParams(next === 'posts' ? {} : { tab: next }, { replace: true });
  };

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      const result = await communityService.joinCommunity(communityId);
      toast.success(result.message);
      community.reload();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    try {
      await communityService.leaveCommunity(communityId);
      toast.success(`You've left ${data.name}`);
      community.reload();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (community.isLoading) return <LoadingPanel label="Loading community" />;
  if (community.error) return <ErrorState error={community.error} onRetry={community.reload} />;

  const tabs = [
    { value: 'posts', label: 'Posts', count: data.postCount },
    { value: 'events', label: 'Events', count: data.eventCount },
    ...(isMember ? [{ value: 'members', label: 'Members', count: data.memberCount }] : []),
    { value: 'about', label: 'About' },
  ];

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        {data.coverImageUrl ? (
          <img
            src={mediaUrl(data.coverImageUrl)}
            alt={`${data.name} cover`}
            className="h-32 w-full object-cover sm:h-44"
          />
        ) : (
          <BuildingIcon
            aria-hidden="true"
            className="grid h-24 w-full place-items-center bg-primary-soft text-primary sm:h-32"
            strokeWidth={1.5}
          />
        )}

        <div className="px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold">{data.name}</h1>
                {data.status !== 'approved' && (
                  <Badge tone={data.status === 'pending' ? 'warning' : 'error'}>
                    {COMMUNITY_STATUS_LABELS[data.status]}
                  </Badge>
                )}
                {data.visibility === 'private' && (
                  <Badge>
                    <LockIcon className="h-3 w-3 mr-1" strokeWidth={2} /> Private
                  </Badge>
                )}
                {data.myRole && data.myRole !== 'member' && (
                  <Badge tone="primary">{COMMUNITY_ROLE_LABELS[data.myRole]}</Badge>
                )}
              </div>
              <p className="mt-1 text-sm text-ink-subtle">
                <MapPinIcon
                  className="inline h-3.5 w-3.5 mr-1"
                  strokeWidth={2}
                  aria-hidden="true"
                />
                {formatLocation(data.location)}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {canManage && (
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
                  Edit
                </Button>
              )}
              {isMember && data.myRole !== 'admin' && (
                <Button variant="ghost" size="sm" onClick={() => setConfirmLeave(true)}>
                  Leave
                </Button>
              )}
              {!data.myStatus && (
                <Button size="sm" onClick={handleJoin} isLoading={isJoining}>
                  {data.requiresApproval || data.visibility === 'private'
                    ? 'Request to join'
                    : 'Join community'}
                </Button>
              )}
              {data.myStatus === 'pending' && <Badge tone="warning">Awaiting approval</Badge>}
            </div>
          </div>

          {data.description && <p className="mt-3 text-base text-ink-muted">{data.description}</p>}

          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-subtle">
            <div className="flex gap-1">
              <dt>Members</dt>
              <dd className="font-medium text-ink">{formatCount(data.memberCount)}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Posts</dt>
              <dd className="font-medium text-ink">{formatCount(data.postCount)}</dd>
            </div>
            <div className="flex gap-1">
              <dt>Events</dt>
              <dd className="font-medium text-ink">{formatCount(data.eventCount)}</dd>
            </div>
          </dl>
        </div>
      </Card>

      <Tabs tabs={tabs} value={tab} onChange={switchTab} label="Community sections" />

      <TabPanel value="posts" active={tab}>
        <div className="space-y-4">
          {isMember && (
            <PostComposer
              communityId={data._id}
              communityName={data.name}
              categories={categories || []}
              onCreated={posts.prependItem}
            />
          )}

          {posts.isLoading && <LoadingPanel label="Loading posts" />}
          {posts.error && <ErrorState error={posts.error} onRetry={posts.reload} />}

          {posts.isEmpty && (
            <Card>
              <EmptyState
                icon="file-text"
                title="No posts yet"
                description={isMember ? 'Start the conversation.' : 'Join to post here.'}
              />
            </Card>
          )}

          {posts.items.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              showCommunity={false}
              onPatch={posts.patchItem}
              onRemove={posts.removeItem}
            />
          ))}

          {posts.meta && posts.meta.totalPages > 1 && (
            <Card>
              <Pagination
                meta={posts.meta}
                page={posts.page}
                onChange={posts.setPage}
                className="border-t-0"
              />
            </Card>
          )}
        </div>
      </TabPanel>

      <TabPanel value="events" active={tab}>
        <div className="space-y-4">
          {isMember && (
            <div className="flex justify-end">
              <Button onClick={() => setIsCreatingEvent(true)}>Create event</Button>
            </div>
          )}

          {events.isLoading && <LoadingPanel label="Loading events" />}
          {events.error && <ErrorState error={events.error} onRetry={events.reload} />}

          {events.isEmpty && (
            <Card>
              <EmptyState
                icon="calendar"
                title="Nothing scheduled"
                description={
                  isMember ? 'Organise the first gathering.' : 'No upcoming events here yet.'
                }
              />
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            {events.items.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                showCommunity={false}
                onPatch={events.patchItem}
              />
            ))}
          </div>

          {events.meta && events.meta.totalPages > 1 && (
            <Card>
              <Pagination
                meta={events.meta}
                page={events.page}
                onChange={events.setPage}
                className="border-t-0"
              />
            </Card>
          )}
        </div>
      </TabPanel>

      <TabPanel value="members" active={tab}>
        <MemberList community={data} canModerate={canModerate} canManageRoles={canManage} />
      </TabPanel>

      <TabPanel value="about" active={tab}>
        <div className="space-y-4">
          <Card>
            <CardHeader title="Community rules" />
            <CardBody>
              {data.rules?.length > 0 ? (
                <ol className="space-y-3">
                  {data.rules.map((rule, index) => (
                    <li key={rule._id || rule.title} className="flex gap-3">
                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-medium">{rule.title}</p>
                        {rule.body && <p className="mt-0.5 text-sm text-ink-muted">{rule.body}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-ink-subtle">
                  No rules have been set yet.
                  {canManage && ' Add them from the Edit screen so newcomers know what to expect.'}
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Details" />
            <CardBody>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-ink-subtle">Location</dt>
                  <dd className="font-medium">{formatLocation(data.location) || '—'}</dd>
                </div>
                <div>
                  <dt className="text-ink-subtle">Visibility</dt>
                  <dd className="font-medium capitalize">{data.visibility}</dd>
                </div>
                <div>
                  <dt className="text-ink-subtle">Join requests</dt>
                  <dd className="font-medium">
                    {data.requiresApproval ? 'Reviewed by moderators' : 'Open to all'}
                  </dd>
                </div>
                <div>
                  <dt className="text-ink-subtle">Created by</dt>
                  <dd className="font-medium">{data.createdBy?.name || '—'}</dd>
                </div>
              </dl>

              {data.tags?.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-1.5">
                  {data.tags.map((tag) => (
                    <li key={tag}>
                      <Badge>#{tag}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {canModerate && (
            <Card>
              <CardHeader
                title="Moderation"
                description="Reports raised in this community appear in the moderation queue."
                actions={
                  <Button as={Link} to="/moderation" size="sm" variant="outline">
                    Open queue
                  </Button>
                }
              />
            </Card>
          )}
        </div>
      </TabPanel>

      <Modal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        title="Edit community"
        size="lg"
      >
        <CommunityForm
          community={data}
          onSaved={() => {
            setIsEditing(false);
            community.reload();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </Modal>

      <Modal
        isOpen={isCreatingEvent}
        onClose={() => setIsCreatingEvent(false)}
        title="Create an event"
        size="lg"
      >
        <EventForm
          communityId={data._id}
          onSaved={() => {
            setIsCreatingEvent(false);
            events.reload();
          }}
          onCancel={() => setIsCreatingEvent(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmLeave}
        onClose={() => setConfirmLeave(false)}
        onConfirm={handleLeave}
        title={`Leave ${data.name}?`}
        message="You will stop seeing its posts and events in your feed. You can rejoin later."
        confirmLabel="Leave community"
      />
    </div>
  );
}
