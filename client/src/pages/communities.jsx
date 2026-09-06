/**
 * pages/communities.jsx — the community directory (Phase 3).
 *
 * Search by name, filter by city, sort by newest or largest, and create a new
 * community. "My communities" is a tab rather than a separate page.
 */
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Button from '../components/ui/Button';
import Card from '../components/ui/Card';
import EmptyState, { ErrorState } from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Pagination from '../components/ui/Pagination';
import { Select } from '../components/ui/Field';
import { LoadingPanel } from '../components/ui/Spinner';
import Tabs, { TabPanel } from '../components/ui/Tabs';
import CommunityCard from '../features/communities/CommunityCard';
import CommunityForm from '../features/communities/CommunityForm';
import useAsync from '../hooks/useAsync';
import useDebounce from '../hooks/useDebounce';
import usePaginatedList from '../hooks/usePaginatedList';
import { useTheme } from '../context/ThemeContext';
import * as communityService from '../services/communityService';
import { SORT_OPTIONS } from '../utils/constants';

export default function CommunitiesPage() {
  const [params, setParams] = useSearchParams();
  const { feedView } = useTheme();

  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState(params.get('q') || '');
  const [city, setCity] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const debouncedSearch = useDebounce(search);
  const debouncedCity = useDebounce(city);

  const list = usePaginatedList((query) => communityService.listCommunities(query), {
    initialFilters: { sort: 'recent', q: params.get('q') || undefined },
  });

  const mine = useAsync(() => communityService.myCommunities(), []);

  const { applyFilters } = list;
  useEffect(() => {
    applyFilters({ q: debouncedSearch || undefined, city: debouncedCity || undefined });
  }, [debouncedSearch, debouncedCity, applyFilters]);

  // Keep the URL in step so a search can be shared or bookmarked.
  useEffect(() => {
    setParams(debouncedSearch ? { q: debouncedSearch } : {}, { replace: true });
  }, [debouncedSearch, setParams]);

  const handleCreated = (community) => {
    setIsCreating(false);
    mine.reload();
    if (community.status === 'approved') list.reload();
  };

  const tabs = [
    { value: 'all', label: 'All communities' },
    { value: 'mine', label: 'My communities', count: (mine.data || []).length },
  ];

  const gridClass = feedView === 'grid' ? 'grid gap-4 md:grid-cols-2' : 'space-y-4';

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Communities</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            Find your city or village — or start the community it is missing.
          </p>
        </div>
        <Button onClick={() => setIsCreating(true)}>Create community</Button>
      </header>

      <Tabs tabs={tabs} value={tab} onChange={setTab} label="Community lists" />

      <TabPanel value="all" active={tab}>
        <div className="space-y-4">
          <Card className="px-4 py-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="community-search" className="hh-label">
                  Search
                </label>
                <input
                  id="community-search"
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Community name…"
                  className="hh-input"
                />
              </div>
              <div>
                <label htmlFor="community-city" className="hh-label">
                  City or village
                </label>
                <input
                  id="community-city"
                  type="text"
                  value={city}
                  onChange={(event) => setCity(event.target.value)}
                  placeholder="e.g. Kollengode"
                  className="hh-input"
                />
              </div>
              <Select
                label="Sort by"
                value={list.filters.sort || 'recent'}
                onChange={(event) => applyFilters({ sort: event.target.value })}
                options={SORT_OPTIONS}
              />
            </div>
          </Card>

          {list.isLoading && <LoadingPanel label="Loading communities" />}
          {list.error && <ErrorState error={list.error} onRetry={list.reload} />}

          {list.isEmpty && (
            <Card>
              <EmptyState
                icon="search"
                title="No communities found"
                description={
                  search || city
                    ? 'Nothing matches that search yet. Try a different spelling, or create the community.'
                    : 'No communities have been approved yet.'
                }
                action={<Button onClick={() => setIsCreating(true)}>Create a community</Button>}
              />
            </Card>
          )}

          {list.items.length > 0 && (
            <div className={gridClass}>
              {list.items.map((community) => (
                <CommunityCard
                  key={community._id}
                  community={community}
                  onPatch={list.patchItem}
                  view={feedView}
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
      </TabPanel>

      <TabPanel value="mine" active={tab}>
        {mine.isLoading && <LoadingPanel label="Loading your communities" />}
        {mine.error && <ErrorState error={mine.error} onRetry={mine.reload} />}

        {mine.data?.length === 0 && (
          <Card>
            <EmptyState
              icon="building"
              title="You have not joined anything yet"
              description="Join a community from the directory, and it will appear here."
              action={<Button onClick={() => setTab('all')}>Browse the directory</Button>}
            />
          </Card>
        )}

        {mine.data?.length > 0 && (
          <div className={gridClass}>
            {mine.data.map((community) => (
              <CommunityCard key={community._id} community={community} view={feedView} />
            ))}
          </div>
        )}
      </TabPanel>

      <Modal
        isOpen={isCreating}
        onClose={() => setIsCreating(false)}
        title="Create a community"
        description="Tell us about the place it is for."
        size="lg"
      >
        <CommunityForm onSaved={handleCreated} onCancel={() => setIsCreating(false)} />
      </Modal>
    </div>
  );
}
