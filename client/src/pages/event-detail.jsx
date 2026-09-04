/**
 * pages/event-detail.jsx — a single event with its RSVP list and organiser tools.
 */
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Card, { CardBody, CardHeader } from '../components/ui/Card';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { ErrorState } from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { LoadingPanel } from '../components/ui/Spinner';
import EventForm from '../features/events/EventForm';
import { useToast } from '../context/ToastContext';
import useAsync from '../hooks/useAsync';
import * as eventService from '../services/eventService';
import { formatCount, formatDateTime, formatEventWindow, mediaUrl } from '../utils/format';
import { RSVP_LABELS, RSVP_OPTIONS } from '../utils/constants';

export default function EventDetailPage() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  const {
    data: event,
    error,
    isLoading,
    setData,
    reload,
  } = useAsync(() => eventService.getEvent(eventId), [eventId]);

  if (isLoading) return <LoadingPanel label="Loading event" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  const community = event.community || {};
  const isCancelled = event.status === 'cancelled';

  const setRsvp = async (status) => {
    setIsBusy(true);
    try {
      const result =
        status === null
          ? await eventService.withdrawRsvp(event._id)
          : await eventService.rsvp(event._id, status);
      setData((current) => ({ ...current, ...result }));
      reload();
      toast.success(
        status === null ? 'RSVP withdrawn' : `Marked as ${RSVP_LABELS[status].toLowerCase()}`,
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleCancel = async () => {
    try {
      await eventService.cancelEvent(event._id, 'Cancelled by the organiser');
      toast.success('Event cancelled — everyone who RSVP’d has been notified');
      reload();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          ← Back
        </Button>
        {community.name && (
          <Link
            to={`/communities/${community.slug || community._id}`}
            className="truncate text-sm font-medium text-primary hover:underline"
          >
            {community.name}
          </Link>
        )}
      </div>

      <Card className="overflow-hidden">
        {event.coverImageUrl && (
          <img
            src={mediaUrl(event.coverImageUrl)}
            alt={`${event.title} cover`}
            className="h-40 w-full object-cover sm:h-52"
          />
        )}

        <div className="px-4 py-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">{event.title}</h1>
              <p className="mt-1 text-base font-medium text-accent">
                <time dateTime={event.startsAt}>{formatEventWindow(event)}</time>
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              {isCancelled && <Badge tone="error">Cancelled</Badge>}
              {event.isPast && !isCancelled && <Badge>Finished</Badge>}
              {event.isOrganizer && <Badge tone="primary">You organise this</Badge>}
            </div>
          </div>

          {isCancelled && event.cancelReason && (
            <p className="mt-3 rounded-lg bg-error-soft px-3 py-2 text-sm text-error">
              {event.cancelReason}
            </p>
          )}

          {event.description && (
            <p className="mt-3 whitespace-pre-wrap text-base leading-relaxed text-ink-muted">
              {event.description}
            </p>
          )}

          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-ink-subtle">Starts</dt>
              <dd className="font-medium">{formatDateTime(event.startsAt)}</dd>
            </div>
            {event.endsAt && (
              <div>
                <dt className="text-ink-subtle">Ends</dt>
                <dd className="font-medium">{formatDateTime(event.endsAt)}</dd>
              </div>
            )}
            <div>
              <dt className="text-ink-subtle">Where</dt>
              <dd className="font-medium">
                {event.location?.isOnline ? (
                  event.location.meetingUrl ? (
                    <a
                      href={event.location.meetingUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-primary hover:underline"
                    >
                      Join online →
                    </a>
                  ) : (
                    'Online'
                  )
                ) : (
                  [event.location?.venue, event.location?.address, event.location?.city]
                    .filter(Boolean)
                    .join(', ') || 'To be confirmed'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Organised by</dt>
              <dd className="font-medium">{event.organizer?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-ink-subtle">Going</dt>
              <dd className="font-medium">
                {formatCount(event.goingCount)}
                {event.capacity > 0 && ` of ${event.capacity} places`}
              </dd>
            </div>
            {event.interestedCount > 0 && (
              <div>
                <dt className="text-ink-subtle">Interested</dt>
                <dd className="font-medium">{formatCount(event.interestedCount)}</dd>
              </div>
            )}
          </dl>

          {!isCancelled && !event.isPast && (
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <span className="text-sm font-medium text-ink-muted">Will you be there?</span>
              {RSVP_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  size="sm"
                  variant={event.myRsvp === option.value ? 'primary' : 'outline'}
                  onClick={() => setRsvp(event.myRsvp === option.value ? null : option.value)}
                  disabled={isBusy}
                >
                  {event.myRsvp === option.value ? `✓ ${option.label}` : option.label}
                </Button>
              ))}
            </div>
          )}

          {event.isOrganizer && !isCancelled && (
            <div className="mt-3 flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                Edit event
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-error hover:bg-error-soft"
                onClick={() => setConfirmCancel(true)}
              >
                Cancel event
              </Button>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Who's coming" description={`${formatCount(event.goingCount)} going`} />
        <CardBody>
          {event.attendees?.length > 0 ? (
            <ul className="flex flex-wrap gap-3">
              {event.attendees.map((attendee) => (
                <li key={attendee.user?._id || attendee.user} className="flex items-center gap-2">
                  <Avatar name={attendee.user?.name} src={attendee.user?.avatarUrl} size="sm" />
                  <span className="text-sm">
                    <span className="block font-medium">{attendee.user?.name || 'Someone'}</span>
                    <span className="block text-xs text-ink-subtle">
                      {RSVP_LABELS[attendee.status]}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-subtle">No responses yet — be the first.</p>
          )}
        </CardBody>
      </Card>

      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Edit event" size="lg">
        <EventForm
          event={event}
          onSaved={() => {
            setIsEditing(false);
            reload();
          }}
          onCancel={() => setIsEditing(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={handleCancel}
        title="Cancel this event?"
        message="Everyone who RSVP'd will be notified. The event stays visible but is marked cancelled."
        confirmLabel="Cancel event"
      />
    </div>
  );
}
