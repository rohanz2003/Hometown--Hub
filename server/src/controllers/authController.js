/**
 * controllers/authController.js — Phase 1 HTTP layer for authentication.
 *
 * Access tokens go back in the JSON body; refresh tokens only ever travel as an
 * httpOnly cookie so no long-lived credential is readable by client scripts.
 */
const authService = require('../services/authService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { setRefreshCookie, clearRefreshCookie, REFRESH_COOKIE_NAME } = require('../utils/tokens');

/** Sends `{ user, accessToken }` and sets the refresh cookie. */
function respondWithSession(res, { user, accessToken, refreshToken }, status = 200) {
  setRefreshCookie(res, refreshToken);
  return sendSuccess(res, { user, accessToken }, { status });
}

const register = asyncHandler(async (req, res) => {
  const session = await authService.register(req.body);
  return respondWithSession(res, session, 201);
});

const login = asyncHandler(async (req, res) => {
  const session = await authService.login(req.body);
  return respondWithSession(res, session);
});

/** Rotates the token pair using the refresh cookie. */
const refresh = asyncHandler(async (req, res) => {
  const token = req.cookies ? req.cookies[REFRESH_COOKIE_NAME] : null;
  const session = await authService.refresh(token);
  return respondWithSession(res, session);
});

const logout = asyncHandler(async (req, res) => {
  clearRefreshCookie(res);
  return sendSuccess(res, { message: 'Signed out' });
});

/** Signs out of every device by bumping the user's token version. */
const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user._id);
  clearRefreshCookie(res);
  return sendSuccess(res, { message: 'Signed out on all devices' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const result = await authService.requestPasswordReset(req.body.email);
  return sendSuccess(res, {
    message: 'If that email is registered, a reset link is on its way.',
    ...result,
  });
});

const resetPassword = asyncHandler(async (req, res) => {
  const session = await authService.resetPassword(req.body);
  return respondWithSession(res, session);
});

const changePassword = asyncHandler(async (req, res) => {
  const session = await authService.changePassword({
    userId: req.user._id,
    currentPassword: req.body.currentPassword,
    newPassword: req.body.newPassword,
  });
  return respondWithSession(res, session);
});

/** Current session identity — used by the client on boot. */
const me = asyncHandler(async (req, res) => sendSuccess(res, { user: req.user.toPublicJSON() }));

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  changePassword,
  me,
};
