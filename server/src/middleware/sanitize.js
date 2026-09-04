/**
 * middleware/sanitize.js — strips MongoDB operator injection from user input.
 *
 * Any key starting with `$` or containing a `.` is removed before it can reach a
 * query, so a body like `{ "email": { "$ne": null } }` cannot bypass a lookup.
 */
const MAX_DEPTH = 8;

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/** Returns a cleaned copy; never mutates the caller's object. */
function clean(value, depth = 0) {
  if (depth > MAX_DEPTH) return undefined;
  if (Array.isArray(value)) return value.map((item) => clean(item, depth + 1));
  if (!isPlainObject(value)) return value;

  return Object.entries(value).reduce((acc, [key, val]) => {
    if (key.startsWith('$') || key.includes('.')) return acc;
    acc[key] = clean(val, depth + 1);
    return acc;
  }, {});
}

function sanitizeRequest(req, res, next) {
  if (req.body) req.body = clean(req.body);
  if (req.params) req.params = clean(req.params);
  if (req.query) {
    const cleaned = clean(req.query);
    Object.keys(req.query).forEach((key) => {
      if (!(key in cleaned)) delete req.query[key];
    });
    Object.assign(req.query, cleaned);
  }
  return next();
}

module.exports = { sanitizeRequest, clean };
