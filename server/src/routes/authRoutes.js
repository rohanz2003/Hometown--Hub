/**
 * routes/authRoutes.js — `/api/v1/auth`
 *
 * Phase 1: register, login, logout, refresh, password reset.
 * All credential endpoints are rate-limited and schema-validated.
 */
const express = require('express');
const controller = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');
const schemas = require('../validation/authSchemas');

const router = express.Router();

router.post(
  '/register',
  authLimiter,
  validate({ body: schemas.registerSchema }),
  controller.register,
);
router.post('/login', authLimiter, validate({ body: schemas.loginSchema }), controller.login);
router.post('/refresh', controller.refresh);
router.post('/logout', controller.logout);
router.post('/logout-all', authenticate, controller.logoutAll);

router.post(
  '/forgot-password',
  authLimiter,
  validate({ body: schemas.forgotPasswordSchema }),
  controller.forgotPassword,
);
router.post(
  '/reset-password',
  authLimiter,
  validate({ body: schemas.resetPasswordSchema }),
  controller.resetPassword,
);
router.post(
  '/change-password',
  authenticate,
  validate({ body: schemas.changePasswordSchema }),
  controller.changePassword,
);

router.get('/me', authenticate, controller.me);

module.exports = router;
