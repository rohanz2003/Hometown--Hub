/**
 * middleware/errorHandler.js — centralized error handling.
 *
 * The only place in the server that turns a thrown value into an HTTP response.
 * Stack traces are logged, never sent to the client (rules.md § Error handling).
 */
const { sendError } = require('../utils/response');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../config/env');

/** Terminal 404 handler for unmatched routes. */
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`No route matches ${req.method} ${req.originalUrl}`));
}

/** Translates Mongoose/JWT/multer errors into user-facing ApiErrors. */
function normalizeError(err) {
  if (err instanceof ApiError) return err;

  if (err && err.name === 'ValidationError' && err.errors) {
    const details = Object.entries(err.errors).map(([field, e]) => ({
      field,
      message: e.message,
    }));
    return ApiError.badRequest('Some fields need attention', { code: 'VALIDATION_ERROR', details });
  }

  if (err && err.name === 'CastError') {
    return ApiError.badRequest(`That ${err.path === '_id' ? 'id' : err.path} is not valid`, {
      code: 'INVALID_ID',
    });
  }

  // Duplicate key — surface which field collided, not the raw driver message.
  if (err && err.code === 11000) {
    const field = Object.keys(err.keyPattern || err.keyValue || {})[0] || 'value';
    return ApiError.conflict(`That ${field} is already taken`, { code: 'DUPLICATE_KEY' });
  }

  if (err && (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError')) {
    return ApiError.unauthorized('Your session has expired — please sign in again', {
      code: 'INVALID_TOKEN',
    });
  }

  if (err && err.name === 'MulterError') {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'That image is too large'
        : 'That file could not be uploaded';
    return ApiError.badRequest(message, { code: err.code });
  }

  return null;
}

/* eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity (4 args). */
function errorHandler(err, req, res, next) {
  const known = normalizeError(err);
  const statusCode = known ? known.statusCode : 500;

  // Log with enough context to debug, without leaking request bodies.
  const meta = {
    method: req.method,
    route: req.originalUrl,
    userId: req.user ? String(req.user.id) : null,
    statusCode,
  };
  if (statusCode >= 500) {
    logger.error(err && err.message ? err.message : 'Unhandled error', {
      ...meta,
      stack: err && err.stack,
    });
  } else {
    logger.warn(known.message, meta);
  }

  if (!known) {
    return sendError(res, {
      status: 500,
      message: 'Something went wrong on our end. Please try again.',
      code: 'INTERNAL_ERROR',
      // Only in non-production, and only the message — never the stack.
      details: env.isProduction ? undefined : { hint: err && err.message },
    });
  }

  return sendError(res, {
    status: known.statusCode,
    message: known.message,
    code: known.code,
    details: known.details,
  });
}

module.exports = { errorHandler, notFoundHandler, normalizeError };
