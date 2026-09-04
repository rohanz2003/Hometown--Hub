/**
 * hooks/useDebounce.js — delays a fast-changing value.
 *
 * Used by search boxes so typing does not fire a request per keystroke.
 */
import { useEffect, useState } from 'react';

export default function useDebounce(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
