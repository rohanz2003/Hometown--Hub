/**
 * middleware/auth.js — authentication and platform-level authorization.
 *
 * `authenticate` verifies the access token and loads the user, so downstream
 * handlers can trust `req.user`. Community-scoped permissions live in
 * `communityAccess.js`.
 */
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { verifyAccessToken, bearerFrom } = require('../utils/tokens');
const { PLATFORM_ROLES } = require('../utils/constants');

async function resolveUser(token) {
  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('That account no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');
  // Reject tokens minted before a password change / global sign-out.
  if ((payload.tv || 0) !== (user.tokenVersion || 0)) {
    throw ApiError.unauthorized('Your session has expired — please sign in again');
  }
  return user;
}

/** Requires a valid access token. */
const authenticate = asyncHandler(async (req, res, next) => {
  const token = bearerFrom(req);
  if (!token) throw ApiError.unauthorized('You need to sign in to continue');
  req.user = await resolveUser(token);
  next();
});

/**
 * Populates `req.user` when a valid token is present but never rejects — used by
 * public reads (e.g. a public community feed) that show extra state when signed in.
 */
const optionalAuth = asyncHandler(async (req, res, next) => {
  const token = bearerFrom(req);
  if (!token) return next();
  try {
    req.user = await resolveUser(token);
  } catch {
    req.user = undefined;
  }
  return next();
});

/** Restricts a route to one or more platform roles. */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden("You don't have permission to do that"));
    }
    return next();
  };
}

const requirePlatformAdmin = requireRole(PLATFORM_ROLES.PLATFORM_ADMIN);

module.exports = { authenticate, optionalAuth, requireRole, requirePlatformAdmin };
