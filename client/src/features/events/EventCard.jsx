/**
 * features/events/EventCard.jsx — one event in a list.
 *
 * The RSVP control lives on the card so people can respond straight from the list.
 */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import { useToast } from '../../context/ToastContext';
import * as eventService from '../../services/eventService';
import { formatCount, formatEventWindow, mediaUrl, truncate } from '../../utils/format';
import { GlobeIcon as MonitorIcon, MapPinIcon, CheckIcon } from '../../components/ui/icons';

export default function EventCard({ event, onPatch, showCommunity = true }) {
  const toast = useToast();
  const [isBusy, setIsBusy] = useState(false);

  const isCancelled = event.status === 'cancelled';
  const community = event.community || {};

  const setRsvp = async (status) => {
    setIsBusy(true);
    try {
      const result =
        status === null
          ? await eventService.withdrawRsvp(event._id)
          : await eventService.rsvp(event._id, status);
      onPatch?.(event._id, result);
      toast.success(
        status === 'going' ? "You're going!" : status === null ? 'RSVP withdrawn' : 'Noted',
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <article className={`hh-card overflow-hidden ${isCancelled ? 'opacity-75' : ''}`}>
      {event.coverImageUrl && (
        <img
          src={mediaUrl(event.coverImageUrl)}
          alt={`${event.title} cover`}
          loading="lazy"
          className="h-32 w-full object-cover"
        />
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-semibold">
              <Link to={`/events/${event._id}`} className="hover:text-primary hover:underline">
                {event.title}
              </Link>
            </h3>

            <p className="mt-0.5 text-sm font-medium text-accent">
              <time dateTime={event.startsAt}>{formatEventWindow(event)}</time>
            </p>

            {showCommunity && community.name && (
              <p className="mt-0.5 truncate text-xs text-ink-subtle">
                in{' '}
                <Link
                  to={`/communities/${community.slug || community._id}`}
                  className="text-primary hover:underline"
                >
                  {community.name}
                </Link>
              </p>
            )}
          </div>

          {isCancelled && <Badge tone="error">Cancelled</Badge>}
        </div>

        {event.description && (
          <p className="mt-2 text-sm text-ink-muted">{truncate(event.description, 150)}</p>
        )}

        <p className="mt-2 text-sm text-ink-subtle flex items-center gap-1">
          {event.location?.isOnline
            ? <><MonitorIcon className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> Online</>
            : <><MapPinIcon className="h-4 w-4" strokeWidth={2} aria-hidden="true" /> {event.location?.venue || event.location?.city || 'Location to be confirmed'}</>}
        </p>

        <p className="mt-1 text-xs text-ink-subtle">
          <span className="font-medium text-ink-muted">{formatCount(event.goingCount)}</span> going
          {event.interestedCount > 0 && ` · ${formatCount(event.interestedCount)} interested`}
          {event.capacity > 0 && ` · ${event.capacity} places`}
        </p>

        {!isCancelled && !event.isPast && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={event.myRsvp === 'going' ? 'secondary' : 'primary'}
              onClick={() => setRsvp(event.myRsvp === 'going' ? null : 'going')}
              isLoading={isBusy}
            >
              {event.myRsvp === 'going' ? <><CheckIcon className="h-4 w-4 mr-1" strokeWidth={2} /> You're going</> : 'Going'}
            </Button>
            <Button
              size="sm"
              variant={event.myRsvp === 'interested' ? 'soft' : 'outline'}
              onClick={() => setRsvp(event.myRsvp === 'interested' ? null : 'interested')}
              disabled={isBusy}
            >
              {event.myRsvp === 'interested' ? <><CheckIcon className="h-4 w-4 mr-1" strokeWidth={2} /> Interested</> : 'Interested'}
            </Button>
            <Button as={Link} to={`/events/${event._id}`} size="sm" variant="ghost">
              Details
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
