/**
 * utils/format.test.js — unit tests for the display formatters.
 */
import {
  formatCount,
  formatEventWindow,
  formatLocation,
  formatRelative,
  initials,
  mediaUrl,
  toDateTimeInput,
  truncate,
} from './format';

describe('formatCount', () => {
  it('leaves small numbers alone', () => {
    expect(formatCount(0)).toBe('0');
    expect(formatCount(999)).toBe('999');
  });

  it('abbreviates thousands and millions', () => {
    expect(formatCount(1000)).toBe('1k');
    expect(formatCount(1500)).toBe('1.5k');
    expect(formatCount(23400)).toBe('23k');
    expect(formatCount(2400000)).toBe('2.4m');
  });

  it('treats junk as zero', () => {
    expect(formatCount(undefined)).toBe('0');
    expect(formatCount(null)).toBe('0');
  });
});

describe('formatLocation', () => {
  it('joins the two most specific parts', () => {
    expect(formatLocation({ city: 'Kollengode', state: 'Kerala', country: 'India' })).toBe(
      'Kollengode, Kerala',
    );
  });

  it('skips empty parts', () => {
    expect(formatLocation({ city: 'Ilesa', state: '', country: 'Nigeria' })).toBe('Ilesa, Nigeria');
  });

  it('handles a missing location', () => {
    expect(formatLocation(null)).toBe('');
    expect(formatLocation({})).toBe('');
  });
});

describe('truncate', () => {
  it('returns short text unchanged', () => {
    expect(truncate('Short note', 50)).toBe('Short note');
  });

  it('cuts on a word boundary and adds an ellipsis', () => {
    const result = truncate('The annual village festival runs for four days every September', 30);
    expect(result.endsWith('…')).toBe(true);
    expect(result.length).toBeLessThanOrEqual(31);
    expect(result).not.toMatch(/\s…$/);
  });
});

describe('initials', () => {
  it('takes the first letter of the first two words', () => {
    expect(initials('Asha Menon')).toBe('AM');
    expect(initials('Ravi Shankar Kulkarni')).toBe('RS');
  });

  it('handles a single name and empty input', () => {
    expect(initials('Meera')).toBe('M');
    expect(initials('')).toBe('?');
    expect(initials(undefined)).toBe('?');
  });
});

describe('formatRelative', () => {
  it('describes the recent past', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatRelative(fiveMinutesAgo)).toMatch(/5 minutes ago/);
  });

  it('describes the near future', () => {
    const inThreeDays = new Date(Date.now() + 3 * 86400000);
    expect(formatRelative(inThreeDays)).toMatch(/in 3 days/);
  });

  it('returns an empty string for missing or invalid input', () => {
    expect(formatRelative(null)).toBe('');
    expect(formatRelative('not-a-date')).toBe('');
  });
});

describe('formatEventWindow', () => {
  it('shows a same-day time range', () => {
    const result = formatEventWindow({
      startsAt: '2026-09-12T09:00:00',
      endsAt: '2026-09-12T12:30:00',
    });
    expect(result).toMatch(/–/);
    expect(result).toMatch(/12 Sep/);
  });

  it('marks an all-day event', () => {
    expect(formatEventWindow({ startsAt: '2026-09-12T00:00:00', isAllDay: true })).toMatch(
      /All day/,
    );
  });

  it('handles a start with no end', () => {
    const result = formatEventWindow({ startsAt: '2026-09-12T18:30:00' });
    expect(result).not.toMatch(/–/);
    expect(result).toMatch(/12 Sep/);
  });

  it('returns an empty string with no start date', () => {
    expect(formatEventWindow({})).toBe('');
  });
});

describe('mediaUrl', () => {
  it('passes absolute URLs through', () => {
    expect(mediaUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });

  it('prefixes a stored upload path', () => {
    expect(mediaUrl('/uploads/photo.jpg')).toBe('/uploads/photo.jpg');
  });

  it('returns an empty string for no path', () => {
    expect(mediaUrl('')).toBe('');
  });
});

describe('toDateTimeInput', () => {
  it('formats a date for a datetime-local input', () => {
    expect(toDateTimeInput('2026-09-12T18:30:00')).toBe('2026-09-12T18:30');
  });

  it('returns an empty string for no value', () => {
    expect(toDateTimeInput(null)).toBe('');
  });
});
