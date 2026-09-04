/**
 * pages/feed.jsx — the personal feed across every joined community.
 *
 * Composing a post needs a target community, so the composer only appears once a
 * community is selected from the filter row.
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import Pagination from '../components/ui/Pagination';
import { LoadingPanel } from '../components/ui/Spinner';
import { Select } from '../components/ui/Field';
import PostCard from '../features/posts/PostCard';
import PostComposer from '../features/posts/PostComposer';
import useAsync from '../hooks/useAsync';
import useDebounce from '../hooks/useDebounce';
import usePaginatedList from '../hooks/usePaginatedList';
import { useTheme } from '../context/ThemeContext';
import * as communityService from '../services/communityService';
import * as dashboardService from '../services/dashboardService';
import * as postService from '../services/postService';
import { POST_TYPES, SORT_OPTIONS } from '../utils/constants';

export default function FeedPage() {
  const { feedView, setFeedView } = useTheme();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { data: myCommunities } = useAsync(() => communityService.myCommunities(), []);
  const { data: categories } = useAsync(() => dashboardService.listCategories(), []);

  const list = usePaginatedList((params) => postService.feed(params), {
    initialFilters: { sort: 'recent' },
  });

  // Re-query when the debounced search term settles.
  const { applyFilters } = list;
  useEffect(() => {
    applyFilters({ q: debouncedSearch || undefined });
  }, [debouncedSearch, applyFilters]);

  const joinable = (myCommunities || []).filter(
    (c) => c.myStatus === 'approved' && c.status === 'approved',
  );
  const selectedCommunity = joinable.find((c) => c._id === list.filters.community);

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Your feed</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Updates from every community you have joined.
          </p>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-line p-0.5">
          {['list', 'grid'].map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setFeedView(view)}
              aria-pressed={feedView === view}
              className={`rounded px-2.5 py-1 text-sm font-medium capitalize transition-colors ${
                feedView === view ? 'bg-primary-soft text-primary' : 'text-ink-muted hover:text-ink'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </header>

      {selectedCommunity ? (
        <PostComposer
          communityId={selectedCommunity._id}
          communityName={selectedCommunity.name}
          categories={categories || []}
          onCreated={list.prependItem}
        />
      ) : (
        joinable.length > 0 && (
          <Card className="px-4 py-3 text-sm text-ink-muted">
            Pick a community below to post, or open a community page to share something there.
          </Card>
        )
      )}

      {/* Filters, in one row above the list. */}
      <Card className="px-4 py-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="feed-search" className="hh-label">
              Search
            </label>
            <input
              id="feed-search"
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find a post…"
              className="hh-input"
            />
          </div>

          <Select
            label="Community"
            placeholder="All my communities"
            value={list.filters.community || ''}
            onChange={(event) => list.applyFilters({ community: event.target.value || undefined })}
            options={joinable.map((c) => ({ value: c._id, label: c.name }))}
          />

          <Select
            label="Type"
            placeholder="Any type"
            value={list.filters.type || ''}
            onChange={(event) => list.applyFilters({ type: event.target.value || undefined })}
            options={POST_TYPES.map((t) => ({ value: t.value, label: t.label }))}
          />

          <Select
            label="Sort by"
            value={list.filters.sort || 'recent'}
            onChange={(event) => list.applyFilters({ sort: event.target.value })}
            options={SORT_OPTIONS}
          />
        </div>
      </Card>

      {list.isLoading && <LoadingPanel label="Loading posts" />}
      {list.error && <ErrorState error={list.error} onRetry={list.reload} />}

      {list.isEmpty && (
        <Card>
          {joinable.length === 0 ? (
            <EmptyState
              icon="🏘️"
              title="Join a community to see posts"
              description="Your feed fills up with updates from the communities you join."
              action={
                <Button as={Link} to="/communities">
                  Browse communities
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon="📰"
              title="Nothing here yet"
              description={
                list.filters.q || list.filters.type
                  ? 'No posts match those filters — try widening your search.'
                  : 'Be the first to share something with your community.'
              }
            />
          )}
        </Card>
      )}

      {list.items.length > 0 && (
        <div className={feedView === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'space-y-4'}>
          {list.items.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onPatch={list.patchItem}
              onRemove={list.removeItem}
            />
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
