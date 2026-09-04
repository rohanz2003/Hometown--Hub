/**
 * routes/adminRoutes.js — `/api/v1/admin`
 *
 * Platform-admin tools (Phase 4). The report queue is the one exception: it is
 * also open to community moderators, who see only their own communities.
 */
const express = require('express');
const controller = require('../controllers/adminController');
const validate = require('../middleware/validate');
const { authenticate, requirePlatformAdmin } = require('../middleware/auth');
const schemas = require('../validation/adminSchemas');

const router = express.Router();

router.use(authenticate);

/* ── Moderation queue (moderators + platform admins) ───────────────────────── */

router.get('/reports', validate({ query: schemas.listReportsSchema }), controller.listReports);
router.patch(
  '/reports/:id',
  validate({ params: schemas.idParamsSchema, body: schemas.resolveReportSchema }),
  controller.resolveReport,
);

/* ── Platform admin only ───────────────────────────────────────────────────── */

router.use(requirePlatformAdmin);

router.get('/stats', controller.stats);

router.get(
  '/communities',
  validate({ query: schemas.listCommunitiesAdminSchema }),
  controller.listCommunities,
);
router.patch(
  '/communities/:id/review',
  validate({ params: schemas.idParamsSchema, body: schemas.reviewCommunitySchema }),
  controller.reviewCommunity,
);

router.get('/users', validate({ query: schemas.listUsersSchema }), controller.listUsers);
router.patch(
  '/users/:id/role',
  validate({ params: schemas.idParamsSchema, body: schemas.setUserRoleSchema }),
  controller.setUserRole,
);
router.patch(
  '/users/:id/active',
  validate({ params: schemas.idParamsSchema, body: schemas.setUserActiveSchema }),
  controller.setUserActive,
);

router.get('/categories', controller.listCategories);
router.post('/categories', validate({ body: schemas.categorySchema }), controller.createCategory);
router.patch(
  '/categories/:id',
  validate({ params: schemas.idParamsSchema, body: schemas.updateCategorySchema }),
  controller.updateCategory,
);
router.delete(
  '/categories/:id',
  validate({ params: schemas.idParamsSchema }),
  controller.deactivateCategory,
);

module.exports = router;
