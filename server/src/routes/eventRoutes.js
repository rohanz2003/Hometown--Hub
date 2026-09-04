/**
 * routes/eventRoutes.js — `/api/v1/events`
 *
 * Event detail, edits, cancellation, and RSVPs. Creating an event is
 * community-scoped and lives in `communityRoutes.js`.
 */
const express = require('express');
const controller = require('../controllers/eventController');
const validate = require('../middleware/validate');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { writeLimiter } = require('../middleware/rateLimit');
const { singleImage } = require('../middleware/upload');
const {
  loadEvent,
  requireReadAccess,
  requireWriteAccess,
} = require('../middleware/resourceAccess');
const schemas = require('../validation/eventSchemas');
const { COMMUNITY_ROLES } = require('../utils/constants');

const router = express.Router();
const asMember = requireWriteAccess(COMMUNITY_ROLES.MEMBER);

router.get('/', optionalAuth, validate({ query: schemas.listEventsSchema }), controller.list);

router.get(
  '/:eventId',
  optionalAuth,
  validate({ params: schemas.eventParamsSchema }),
  loadEvent,
  requireReadAccess,
  controller.detail,
);
router.patch(
  '/:eventId',
  authenticate,
  singleImage('image'),
  validate({ params: schemas.eventParamsSchema, body: schemas.updateEventSchema }),
  loadEvent,
  asMember,
  controller.update,
);
router.post(
  '/:eventId/cancel',
  authenticate,
  validate({ params: schemas.eventParamsSchema, body: schemas.cancelEventSchema }),
  loadEvent,
  asMember,
  controller.cancel,
);
router.delete(
  '/:eventId',
  authenticate,
  validate({ params: schemas.eventParamsSchema }),
  loadEvent,
  asMember,
  controller.remove,
);

/* ── RSVP ──────────────────────────────────────────────────────────────────── */

router.post(
  '/:eventId/rsvp',
  authenticate,
  writeLimiter,
  validate({ params: schemas.eventParamsSchema, body: schemas.rsvpSchema }),
  loadEvent,
  asMember,
  controller.rsvp,
);
router.delete(
  '/:eventId/rsvp',
  authenticate,
  validate({ params: schemas.eventParamsSchema }),
  loadEvent,
  asMember,
  controller.withdrawRsvp,
);

module.exports = router;
