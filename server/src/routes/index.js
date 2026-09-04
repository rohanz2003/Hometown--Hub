/**
 * routes/index.js — mounts every versioned REST router under `/api/v1`.
 */
const express = require('express');
const authRoutes = require('./authRoutes');
const userRoutes = require('./userRoutes');
const communityRoutes = require('./communityRoutes');
const { postRouter, commentRouter } = require('./postRoutes');
const eventRoutes = require('./eventRoutes');
const notificationRoutes = require('./notificationRoutes');
const adminRoutes = require('./adminRoutes');
const dashboardController = require('../controllers/dashboardController');
const adminService = require('../services/adminService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) =>
  sendSuccess(res, {
    name: 'Hometown Hub API',
    version: 'v1',
    endpoints: [
      '/auth',
      '/users',
      '/communities',
      '/posts',
      '/comments',
      '/events',
      '/notifications',
      '/dashboard',
      '/categories',
      '/admin',
    ],
  }),
);

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/communities', communityRoutes);
router.use('/posts', postRouter);
router.use('/comments', commentRouter);
router.use('/events', eventRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

/** Phase 2 dashboard summary. */
router.get('/dashboard/summary', authenticate, dashboardController.summary);

/** Active categories are readable by any signed-in user for filters and forms. */
router.get(
  '/categories',
  authenticate,
  asyncHandler(async (req, res) => sendSuccess(res, await adminService.listCategories())),
);

module.exports = router;
