/**
 * utils/response.js — one consistent response envelope for the whole API.
 *
 * Every response is `{ success, data, error }` (rules.md § Error handling) so
 * the client never has to guess the shape.
 */

/** 2xx response. `meta` carries pagination or counts when relevant. */
function sendSuccess(res, data = null, { status = 200, meta } = {}) {
  const body = { success: true, data, error: null };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

/** Non-2xx response. `details` is only ever validation info, never a stack. */
function sendError(res, { status = 500, message = 'Something went wrong', code, details } = {}) {
  const error = { message };
  if (code) error.code = code;
  if (details) error.details = details;
  return res.status(status).json({ success: false, data: null, error });
}

module.exports = { sendSuccess, sendError };
