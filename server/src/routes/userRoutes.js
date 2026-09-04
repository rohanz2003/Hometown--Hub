/**
 * routes/userRoutes.js — `/api/v1/users`
 *
 * The signed-in user's profile and UI preferences, public profiles, and abuse
 * reports raised by members.
 */
const express = require('express');
const controller = require('../controllers/userController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimit');
const { singleImage } = require('../middleware/upload');
const schemas = require('../validation/userSchemas');

const router = express.Router();

router.get('/me', authenticate, controller.profile);
router.patch(
  '/me',
  authenticate,
  singleImage('avatar'),
  validate({ body: schemas.updateProfileSchema }),
  controller.updateProfile,
);
router.patch(
  '/me/preferences',
  authenticate,
  validate({ body: schemas.updatePreferencesSchema }),
  controller.updatePreferences,
);
router.post('/me/deactivate', authenticate, controller.deactivate);

router.post(
  '/reports',
  authenticate,
  writeLimiter,
  validate({ body: schemas.createReportSchema }),
  controller.createReport,
);

router.get(
  '/:userId',
  authenticate,
  validate({ params: schemas.userParamsSchema }),
  controller.publicProfile,
);

module.exports = router;
