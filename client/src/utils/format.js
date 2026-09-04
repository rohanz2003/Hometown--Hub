/**
 * utils/format.js — display formatting helpers.
 *
 * Uses the platform `Intl` APIs rather than a date library, so no extra
 * dependency is needed for the handful of formats the UI actually shows.
 */
import { API_BASE_URL } from '../config/env';

const asDate = (value) => (value instanceof Date ? value : new Date(value));

/** "3 Sep 2026" */
export function formatDate(value) {
  if (!value) return '';
  return asDate(value).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** "3 Sep 2026, 18:30" */
export function formatDateTime(value) {
  if (!value) return '';
  return asDate(value).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** "18:30" */
export function formatTime(value) {
  if (!value) return '';
  return asDate(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

const RELATIVE_UNITS = [
  { limit: 60, unit: 'second', ms: 1000 },
  { limit: 3600, unit: 'minute', ms: 60000 },
  { limit: 86400, unit: 'hour', ms: 3600000 },
  { limit: 604800, unit: 'day', ms: 86400000 },
  { limit: 2629800, unit: 'week', ms: 604800000 },
  { limit: 31557600, unit: 'month', ms: 2629800000 },
];

/** "5 minutes ago" / "in 3 days" — falls back to years for anything older. */
export function formatRelative(value) {
  if (!value) return '';
  const target = asDate(value).getTime();
  if (Number.isNaN(target)) return '';

  const diffMs = target - Date.now();
  const diffSeconds = Math.abs(diffMs) / 1000;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  if (diffSeconds < 45) return rtf.format(Math.round(diffMs / 1000), 'second');

  const match = RELATIVE_UNITS.find((u) => diffSeconds < u.limit) || {
    unit: 'year',
    ms: 31557600000,
  };
  return rtf.format(Math.round(diffMs / match.ms), match.unit);
}

/** Compact date range for an event card: "3 Sep, 18:30 – 21:00". */
export function formatEventWindow({ startsAt, endsAt, isAllDay }) {
  if (!startsAt) return '';
  const start = asDate(startsAt);
  const datePart = start.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  if (isAllDay) return `${datePart} · All day`;
  if (!endsAt) return `${datePart}, ${formatTime(start)}`;

  const end = asDate(endsAt);
  const sameDay = start.toDateString() === end.toDateString();
  return sameDay
    ? `${datePart}, ${formatTime(start)} – ${formatTime(end)}`
    : `${formatDateTime(start)} – ${formatDateTime(end)}`;
}

/** "1.2k" for large counters. */
export function formatCount(value) {
  const n = Number(value) || 0;
  if (n < 1000) return String(n);
  if (n < 1000000) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0).replace(/\.0$/, '')}k`;
  return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}m`;
}

/** "Kollengode, Kerala" — skips empty parts. */
export function formatLocation(location) {
  if (!location) return '';
  return [location.city, location.district, location.state, location.country]
    .filter(Boolean)
    .slice(0, 2)
    .join(', ');
}

/** Initials for the avatar fallback. */
export function initials(name) {
  if (!name) return '?';
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/** Shortens long text for previews, breaking on a word boundary. */
export function truncate(text, max = 180) {
  const value = String(text || '');
  if (value.length <= max) return value;
  const cut = value.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${cut.slice(0, lastSpace > max * 0.6 ? lastSpace : max).trimEnd()}…`;
}

/** Turns a stored `/uploads/...` path into a URL the browser can load. */
export function mediaUrl(path) {
  if (!path) return '';
  if (/^https?:\/\//i.test(path)) return path;
  return `${API_BASE_URL}${path}`;
}

/** Formats a datetime for an `<input type="datetime-local">` value. */
export function toDateTimeInput(value) {
  if (!value) return '';
  const d = asDate(value);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
