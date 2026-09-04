/**
 * hooks/usePaginatedList.js — paginated list state for feeds and directories.
 *
 * Owns the page number, the filter object, and the fetch, and exposes helpers to
 * patch or remove a single item so a like or delete does not require a refetch.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { PAGE_SIZE } from '../utils/constants';

export default function usePaginatedList(
  fetcher,
  { initialFilters = {}, pageSize = PAGE_SIZE } = {},
) {
  const [items, setItems] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const mounted = useRef(true);
  const fetcherRef = useRef(fetcher);
  const filtersRef = useRef(filters);
  fetcherRef.current = fetcher;
  filtersRef.current = filters;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fetcherRef.current({ ...filters, page, limit: pageSize });
      if (!mounted.current) return;
      setItems(result.items || []);
      setMeta(result.meta || null);
    } catch (err) {
      if (mounted.current) setError(err);
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, [filters, page, pageSize]);

  useEffect(() => {
    load();
  }, [load]);

  /** Replaces the filter set and returns to page 1. */
  const applyFilters = useCallback((next) => {
    const { current } = filtersRef;
    const merged = typeof next === 'function' ? next(current) : { ...current, ...next };

    // Bail out when nothing actually changed, so a re-render cannot trigger a refetch.
    const keys = new Set([...Object.keys(current), ...Object.keys(merged)]);
    if ([...keys].every((key) => current[key] === merged[key])) return;

    filtersRef.current = merged;
    setPage(1);
    setFilters(merged);
  }, []);

  /** Merges a patch into one item, matched by `_id`. */
  const patchItem = useCallback((id, patch) => {
    setItems((current) =>
      current.map((item) =>
        String(item._id) === String(id)
          ? { ...item, ...(typeof patch === 'function' ? patch(item) : patch) }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((id) => {
    setItems((current) => current.filter((item) => String(item._id) !== String(id)));
    setMeta((current) =>
      current ? { ...current, total: Math.max(0, current.total - 1) } : current,
    );
  }, []);

  const prependItem = useCallback((item) => {
    setItems((current) => [item, ...current]);
    setMeta((current) => (current ? { ...current, total: current.total + 1 } : current));
  }, []);

  return {
    items,
    meta,
    page,
    setPage,
    filters,
    applyFilters,
    isLoading,
    error,
    reload: load,
    patchItem,
    removeItem,
    prependItem,
    isEmpty: !isLoading && !error && items.length === 0,
  };
}
