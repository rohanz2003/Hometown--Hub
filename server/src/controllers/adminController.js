/**
 * controllers/adminController.js — platform-admin and moderation-queue endpoints.
 */
const adminService = require('../services/adminService');
const reportService = require('../services/reportService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const stats = asyncHandler(async (req, res) =>
  sendSuccess(res, await adminService.getPlatformStats()),
);

const listCommunities = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listCommunities({ query: req.query });
  return sendSuccess(res, items, { meta });
});

const reviewCommunity = asyncHandler(async (req, res) => {
  const community = await adminService.reviewCommunity({
    communityId: req.params.id,
    action: req.body.action,
    note: req.body.note,
    reviewer: req.user,
  });
  return sendSuccess(res, { status: community.status });
});

const listUsers = asyncHandler(async (req, res) => {
  const { items, meta } = await adminService.listUsers({ query: req.query });
  return sendSuccess(res, items, { meta });
});

const setUserRole = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await adminService.setUserRole({ userId: req.params.id, role: req.body.role, actor: req.user }),
  ),
);

const setUserActive = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await adminService.setUserActive({
      userId: req.params.id,
      isActive: req.body.isActive,
      actor: req.user,
    }),
  ),
);

/* ── Reports (visible to community moderators and platform admins) ─────────── */

const listReports = asyncHandler(async (req, res) => {
  const { items, meta } = await reportService.listReports({ user: req.user, query: req.query });
  return sendSuccess(res, items, { meta });
});

const resolveReport = asyncHandler(async (req, res) => {
  const report = await reportService.resolveReport({
    reportId: req.params.id,
    user: req.user,
    status: req.body.status,
    resolutionNote: req.body.resolutionNote,
  });
  return sendSuccess(res, { status: report.status });
});

/* ── Categories ────────────────────────────────────────────────────────────── */

const listCategories = asyncHandler(async (req, res) =>
  sendSuccess(res, await adminService.listCategories({ includeInactive: true })),
);

const createCategory = asyncHandler(async (req, res) =>
  sendSuccess(res, await adminService.createCategory({ data: req.body, actor: req.user }), {
    status: 201,
  }),
);

const updateCategory = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await adminService.updateCategory({ categoryId: req.params.id, data: req.body }),
  ),
);

const deactivateCategory = asyncHandler(async (req, res) =>
  sendSuccess(res, await adminService.deactivateCategory({ categoryId: req.params.id })),
);

module.exports = {
  stats,
  listCommunities,
  reviewCommunity,
  listUsers,
  setUserRole,
  setUserActive,
  listReports,
  resolveReport,
  listCategories,
  createCategory,
  updateCategory,
  deactivateCategory,
};
