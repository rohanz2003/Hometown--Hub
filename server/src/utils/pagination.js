/**
 * utils/pagination.js — shared list pagination helpers.
 *
 * Feeds and lists are always paginated (rules.md § Performance); this keeps the
 * page/limit parsing and the response `meta` block identical everywhere.
 */
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

/** Normalises `?page=&limit=` into safe integers plus a Mongo `skip`. */
function parsePagination(query = {}) {
  const rawPage = Number.parseInt(query.page, 10);
  const rawLimit = Number.parseInt(query.limit, 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX_LIMIT) : DEFAULT_LIMIT;
  return { page, limit, skip: (page - 1) * limit };
}

/** Builds the `meta` block returned alongside every paginated list. */
function buildPageMeta({ page, limit, total }) {
  const totalPages = limit > 0 ? Math.ceil(total / limit) : 0;
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

module.exports = { parsePagination, buildPageMeta, DEFAULT_LIMIT, MAX_LIMIT };
