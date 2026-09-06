/**
 * pages/events.jsx — events across the user's communities (Phase 3).
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { Select } from '../components/ui/Field';
import { LoadingPanel } from '../components/ui/Spinner';
import Tabs from '../components/ui/Tabs';
import EventCard from '../features/events/EventCard';
import useDebounce from '../hooks/useDebounce';
import usePaginatedList from '../hooks/usePaginatedList';
import * as eventService from '../services/eventService';

const WHEN_TABS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

const SCOPE_OPTIONS = [
  { value: 'joined', label: 'My communities' },
  { value: 'all', label: 'Everywhere' },
];

export default function EventsPage() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const debouncedSearch = useDebounce(search);
  const debouncedCity = useDebounce(city);

  const list = usePaginatedList((query) => eventService.listEvents(query), {
    initialFilters: { when: 'upcoming', scope: 'joined' },
  });

  const { applyFilters } = list;
  useEffect(() => {
    applyFilters({ q: debouncedSearch || undefined, city: debouncedCity || undefined });
  }, [debouncedSearch, debouncedCity, applyFilters]);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-2xl font-bold">Events</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Gatherings, festivals, and working parties near you. Create an event from a community
          page.
        </p>
      </header>

      <Tabs
        tabs={WHEN_TABS}
        value={list.filters.when}
        onChange={(when) => applyFilters({ when })}
        label="Event time ranges"
      />

      <Card className="px-4 py-3">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label htmlFor="event-search" className="hh-label">
              Search
            </label>
            <input
              id="event-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Event name…"
              className="hh-input"
            />
          </div>
          <div>
            <label htmlFor="event-city" className="hh-label">
              City or village
            </label>
            <input
              id="event-city"
              type="text"
              value={city}
              onChange={(event) => setCity(event.target.value)}
              placeholder="e.g. Thanjavur"
              className="hh-input"
            />
          </div>
          <Select
            label="Show events from"
            value={list.filters.scope}
            onChange={(event) => applyFilters({ scope: event.target.value })}
            options={SCOPE_OPTIONS}
          />
        </div>
      </Card>

      {list.isLoading && <LoadingPanel label="Loading events" />}
      {list.error && <ErrorState error={list.error} onRetry={list.reload} />}

      {list.isEmpty && (
        <Card>
          <EmptyState
            icon="calendar"
            title={list.filters.when === 'past' ? 'No past events' : 'Nothing scheduled yet'}
            description={
              list.filters.scope === 'joined'
                ? 'Join more communities, or switch to "Everywhere" to see what else is on.'
                : 'No events match those filters.'
            }
            action={
              <Button as={Link} to="/communities">
                Browse communities
              </Button>
            }
          />
        </Card>
      )}

      {list.items.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {list.items.map((event) => (
            <EventCard key={event._id} event={event} onPatch={list.patchItem} />
          ))}
        </div>
      )}

      {list.meta && list.meta.totalPages > 1 && (
        <Card>
          <Pagination
            meta={list.meta}
            page={list.page}
            onChange={list.setPage}
            className="border-t-0"
          />
        </Card>
      )}
    </div>
  );
}
