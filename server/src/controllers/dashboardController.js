/**
 * controllers/dashboardController.js — Phase 2 dashboard summary.
 */
const dashboardService = require('../services/dashboardService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');

const summary = asyncHandler(async (req, res) =>
  sendSuccess(res, await dashboardService.getSummary(req.user._id)),
);

module.exports = { summary };
