/**
 * routes/notificationRoutes.js — `/api/v1/notifications`
 */
const express = require('express');
const controller = require('../controllers/notificationController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const schemas = require('../validation/userSchemas');

const router = express.Router();

router.use(authenticate);

router.get('/', validate({ query: schemas.listNotificationsSchema }), controller.list);
router.get('/unread-count', controller.unreadCount);
router.patch('/read-all', controller.markAllRead);
router.patch(
  '/:notificationId/read',
  validate({ params: schemas.notificationParamsSchema }),
  controller.markRead,
);
router.delete(
  '/:notificationId',
  validate({ params: schemas.notificationParamsSchema }),
  controller.remove,
);

module.exports = router;
