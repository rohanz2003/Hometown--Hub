/**
 * utils/ApiError.js — operational error type carrying an HTTP status.
 *
 * Anything thrown as an ApiError is considered safe to show a user. Every other
 * thrown value is treated as an unexpected bug and reported as a generic 500.
 */
class ApiError extends Error {
  constructor(statusCode, message, { code = undefined, details = undefined } = {}) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.isOperational = true;
    if (code) this.code = code;
    if (details) this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }

  static badRequest(message = 'Invalid request', options) {
    return new ApiError(400, message, options);
  }

  static unauthorized(message = 'You need to sign in to continue', options) {
    return new ApiError(401, message, options);
  }

  static forbidden(message = "You don't have permission to do that", options) {
    return new ApiError(403, message, options);
  }

  static notFound(message = 'Not found', options) {
    return new ApiError(404, message, options);
  }

  static conflict(message = 'That already exists', options) {
    return new ApiError(409, message, options);
  }

  static tooMany(message = 'Too many requests — please slow down', options) {
    return new ApiError(429, message, options);
  }
}

module.exports = ApiError;
