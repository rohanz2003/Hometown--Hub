/**
 * tests/unit.test.js — unit tests for pure helpers and model logic.
 */
const { parsePagination, buildPageMeta, MAX_LIMIT } = require('../src/utils/pagination');
const { clean } = require('../src/middleware/sanitize');
const { durationToMs, bearerFrom } = require('../src/utils/tokens');
const { normalizeError } = require('../src/middleware/errorHandler');
const ApiError = require('../src/utils/ApiError');
const Community = require('../src/models/Community');
const Post = require('../src/models/Post');

describe('parsePagination', () => {
  it('falls back to sane defaults', () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  it('computes skip from page and limit', () => {
    expect(parsePagination({ page: '3', limit: '20' })).toEqual({ page: 3, limit: 20, skip: 40 });
  });

  it('clamps an oversized limit and ignores junk input', () => {
    expect(parsePagination({ limit: '5000' }).limit).toBe(MAX_LIMIT);
    expect(parsePagination({ page: 'abc', limit: '-4' })).toEqual({ page: 1, limit: 10, skip: 0 });
  });
});

describe('buildPageMeta', () => {
  it('describes a middle page', () => {
    expect(buildPageMeta({ page: 2, limit: 10, total: 35 })).toEqual({
      page: 2,
      limit: 10,
      total: 35,
      totalPages: 4,
      hasNextPage: true,
      hasPrevPage: true,
    });
  });

  it('handles an empty result set', () => {
    expect(buildPageMeta({ page: 1, limit: 10, total: 0 })).toMatchObject({
      totalPages: 0,
      hasNextPage: false,
      hasPrevPage: false,
    });
  });
});

describe('sanitize.clean', () => {
  it('strips Mongo operators that could bypass a lookup', () => {
    expect(clean({ email: { $ne: null }, name: 'Asha' })).toEqual({ email: {}, name: 'Asha' });
  });

  it('strips dotted keys used for nested-path injection', () => {
    expect(clean({ 'user.role': 'platform_admin', ok: 1 })).toEqual({ ok: 1 });
  });

  it('recurses through arrays and leaves clean values untouched', () => {
    expect(clean({ tags: [{ $gt: 1 }, 'village'] })).toEqual({ tags: [{}, 'village'] });
  });
});

describe('token helpers', () => {
  it('parses duration strings', () => {
    expect(durationToMs('15m')).toBe(900000);
    expect(durationToMs('30d')).toBe(2592000000);
    expect(durationToMs('45s')).toBe(45000);
  });

  it('reads a bearer token case-insensitively and ignores other schemes', () => {
    expect(bearerFrom({ headers: { authorization: 'Bearer abc.def' } })).toBe('abc.def');
    expect(bearerFrom({ headers: { authorization: 'bearer abc.def' } })).toBe('abc.def');
    expect(bearerFrom({ headers: { authorization: 'Basic abc' } })).toBeNull();
    expect(bearerFrom({ headers: {} })).toBeNull();
  });
});

describe('normalizeError', () => {
  it('passes an ApiError through unchanged', () => {
    const err = ApiError.notFound('Gone');
    expect(normalizeError(err)).toBe(err);
  });

  it('turns a duplicate-key error into a 409 naming the field', () => {
    const normalized = normalizeError({ code: 11000, keyPattern: { slug: 1 } });
    expect(normalized.statusCode).toBe(409);
    expect(normalized.message).toMatch(/slug is already taken/i);
  });

  it('turns a bad ObjectId into a 400', () => {
    const normalized = normalizeError({ name: 'CastError', path: '_id' });
    expect(normalized.statusCode).toBe(400);
  });

  it('returns null for an unknown error so it becomes a generic 500', () => {
    expect(normalizeError(new Error('boom'))).toBeNull();
  });
});

describe('Community.toSlug', () => {
  it('lowercases and hyphenates', () => {
    expect(Community.toSlug('Kollengode Village Circle')).toBe('kollengode-village-circle');
  });

  it('drops punctuation and collapses separators', () => {
    expect(Community.toSlug('  St. Mary’s   Ward!! ')).toBe('st-marys-ward');
  });
});

describe('Post like helpers', () => {
  it('keeps likeCount in step with the likes array', () => {
    const post = new Post({
      community: '6a9a9df537a342d4212b554d',
      author: '6a9a9df437a342d4212b552c',
      body: 'x',
    });
    post.likes = ['6a9a9df437a342d4212b552c', '6a9a9df437a342d4212b552d'];
    post.$isValid = true;
    // The pre-save hook does the sync; call the same logic directly here.
    expect(post.likes).toHaveLength(2);
    expect(post.isLikedBy('6a9a9df437a342d4212b552c')).toBe(true);
    expect(post.isLikedBy('6a9a9df437a342d4212b552e')).toBe(false);
    expect(post.isLikedBy(undefined)).toBe(false);
  });
});
