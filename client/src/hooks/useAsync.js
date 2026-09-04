/**
 * hooks/useAsync.js — small data-loading hook.
 *
 * Gives every screen the same `{ data, error, isLoading, reload }` shape so
 * loading and error states are handled consistently instead of ad hoc per page.
 */
import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAsync(
  asyncFn,
  deps = [],
  { immediate = true, initialData = null } = {},
) {
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(immediate);
  const mounted = useRef(true);
  const fnRef = useRef(asyncFn);

  fnRef.current = asyncFn;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (...args) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await fnRef.current(...args);
      if (mounted.current) setData(result);
      return result;
    } catch (err) {
      if (mounted.current) setError(err);
      throw err;
    } finally {
      if (mounted.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!immediate) return;
    // Errors are captured into state by `run`; nothing to do here.
    run().catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller-supplied dependency list
  }, deps);

  return { data, error, isLoading, reload: run, setData, setError };
}
