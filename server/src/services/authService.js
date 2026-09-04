/**
 * services/authService.js — registration, sign-in, token refresh, password reset.
 *
 * Business logic only: it throws ApiError and returns plain data, leaving HTTP
 * concerns (cookies, status codes) to the controller.
 *
 * NOTE: sending the reset email is out of scope for Phase 1 — no mail provider is
 * listed in the approved stack. The reset link is logged server-side and, outside
 * production, returned in the response so the flow is testable end-to-end.
 * See README § Known limitations.
 */
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');
const env = require('../config/env');
const { PLATFORM_ROLES } = require('../utils/constants');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/tokens');

const RESET_TTL_MINUTES = 30;

function issueTokens(user) {
  return { accessToken: signAccessToken(user), refreshToken: signRefreshToken(user) };
}

/** Creates an account. The configured bootstrap email becomes the platform admin. */
async function register({ name, email, password, phone, hometown }) {
  const existing = await User.findOne({ email });
  if (existing) throw ApiError.conflict('An account with that email already exists');

  const isBootstrapAdmin =
    Boolean(env.PLATFORM_ADMIN_EMAIL) &&
    email.toLowerCase() === env.PLATFORM_ADMIN_EMAIL.toLowerCase();

  const user = new User({
    name,
    email,
    phone: phone || '',
    hometown: hometown || {},
    role: isBootstrapAdmin ? PLATFORM_ROLES.PLATFORM_ADMIN : PLATFORM_ROLES.USER,
  });
  user.password = password;
  await user.save();

  return { user: user.toPublicJSON(), ...issueTokens(user) };
}

/** Verifies credentials. The failure message is deliberately identical for
 *  unknown email and wrong password so it cannot be used to enumerate accounts. */
async function login({ email, password }) {
  const user = await User.findOne({ email }).select('+passwordHash');
  const genericFailure = ApiError.unauthorized('That email or password is incorrect');
  if (!user) throw genericFailure;

  const matches = await user.comparePassword(password);
  if (!matches) throw genericFailure;
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

  user.lastLoginAt = new Date();
  await user.save();

  return { user: user.toPublicJSON(), ...issueTokens(user) };
}

/** Exchanges a valid refresh token for a fresh token pair (rotation). */
async function refresh(refreshToken) {
  if (!refreshToken) throw ApiError.unauthorized('Your session has expired — please sign in again');

  const payload = verifyRefreshToken(refreshToken);
  const user = await User.findById(payload.sub);
  if (!user || !user.isActive) throw ApiError.unauthorized('Your session is no longer valid');
  if ((payload.tv || 0) !== (user.tokenVersion || 0)) {
    throw ApiError.unauthorized('Your session has expired — please sign in again');
  }

  return { user: user.toPublicJSON(), ...issueTokens(user) };
}

/** Invalidates every refresh token for the user ("sign out everywhere"). */
async function logoutAll(userId) {
  await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
}

/**
 * Starts a password reset. Always resolves successfully, even for an unknown
 * email, so the endpoint cannot be used to discover which addresses exist.
 */
async function requestPasswordReset(email) {
  const user = await User.findOne({ email }).select(
    '+passwordResetTokenHash +passwordResetExpiresAt',
  );
  if (!user) return { sent: true };

  const rawToken = user.createPasswordResetToken(RESET_TTL_MINUTES);
  await user.save();

  const resetUrl = `${env.CLIENT_URL}/reset-password?token=${rawToken}&email=${encodeURIComponent(user.email)}`;
  logger.info('Password reset requested', { userId: String(user._id) });

  // Never expose the link in production responses — it is a bearer credential.
  return { sent: true, ...(env.isProduction ? {} : { resetUrl, resetToken: rawToken }) };
}

/** Completes a reset, then invalidates all existing sessions. */
async function resetPassword({ email, token, password }) {
  const user = await User.findOne({
    email,
    passwordResetTokenHash: User.hashResetToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpiresAt');

  if (!user) throw ApiError.badRequest('That reset link is invalid or has expired');

  user.password = password;
  user.passwordResetTokenHash = null;
  user.passwordResetExpiresAt = null;
  user.tokenVersion += 1;
  await user.save();

  return { user: user.toPublicJSON(), ...issueTokens(user) };
}

/** Changes the password of a signed-in user after re-checking the current one. */
async function changePassword({ userId, currentPassword, newPassword }) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw ApiError.notFound('Account not found');

  const matches = await user.comparePassword(currentPassword);
  if (!matches) throw ApiError.badRequest('Your current password is incorrect');

  user.password = newPassword;
  user.tokenVersion += 1;
  await user.save();

  return { user: user.toPublicJSON(), ...issueTokens(user) };
}

module.exports = {
  register,
  login,
  refresh,
  logoutAll,
  requestPasswordReset,
  resetPassword,
  changePassword,
  RESET_TTL_MINUTES,
};
