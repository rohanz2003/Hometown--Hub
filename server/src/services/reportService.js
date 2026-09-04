/**
 * services/reportService.js — abuse reports.
 *
 * Members raise reports; community moderators see reports for their own
 * community and platform admins see every report (phases.doc.md Phase 4).
 */
const Report = require('../models/Report');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Membership = require('../models/Membership');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPageMeta } = require('../utils/pagination');
const { notify } = require('./notificationService');
const {
  COMMUNITY_ROLES,
  MEMBERSHIP_STATUS,
  NOTIFICATION_TYPES,
  PLATFORM_ROLES,
  REPORT_STATUS,
  REPORT_TARGETS,
} = require('../utils/constants');

/** Resolves the reported item so the report can be scoped to a community. */
async function resolveTarget({ targetType, targetId }) {
  if (targetType === REPORT_TARGETS.POST) {
    const post = await Post.findById(targetId).select('community author');
    if (!post) throw ApiError.notFound('That post no longer exists');
    return { community: post.community, owner: post.author };
  }
  if (targetType === REPORT_TARGETS.COMMENT) {
    const comment = await Comment.findById(targetId).select('community author');
    if (!comment) throw ApiError.notFound('That comment no longer exists');
    return { community: comment.community, owner: comment.author };
  }
  return { community: null, owner: targetId };
}

async function createReport({ reporter, targetType, targetId, reason }) {
  const { community, owner } = await resolveTarget({ targetType, targetId });
  if (String(owner) === String(reporter._id)) {
    throw ApiError.badRequest('You cannot report your own content');
  }

  const existing = await Report.findOne({ reporter: reporter._id, targetType, targetId });
  if (existing) throw ApiError.conflict("You've already reported this");

  return Report.create({ reporter: reporter._id, targetType, targetId, community, reason });
}

/** Lists reports visible to the caller. */
async function listReports({ user, query = {} }) {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  if (query.targetType) filter.targetType = query.targetType;

  if (user.role !== PLATFORM_ROLES.PLATFORM_ADMIN) {
    const moderatedCommunities = await Membership.find({
      user: user._id,
      status: MEMBERSHIP_STATUS.APPROVED,
      role: { $in: [COMMUNITY_ROLES.MODERATOR, COMMUNITY_ROLES.ADMIN] },
    })
      .select('community')
      .lean();

    if (moderatedCommunities.length === 0) {
      return { items: [], meta: buildPageMeta({ page, limit, total: 0 }) };
    }
    filter.community = { $in: moderatedCommunities.map((m) => m.community) };
  }

  const [items, total] = await Promise.all([
    Report.find(filter)
      .sort({ status: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('reporter', 'name avatarUrl')
      .populate('community', 'name slug')
      .populate('resolvedBy', 'name')
      .lean(),
    Report.countDocuments(filter),
  ]);

  // Attach a short preview of the reported content for context.
  const withPreview = await Promise.all(items.map(attachPreview));
  return { items: withPreview, meta: buildPageMeta({ page, limit, total }) };
}

async function attachPreview(report) {
  if (report.targetType === REPORT_TARGETS.POST) {
    const post = await Post.findById(report.targetId)
      .select('title body status author')
      .populate('author', 'name')
      .lean();
    return {
      ...report,
      target: post ? { ...post, preview: (post.title || post.body).slice(0, 160) } : null,
    };
  }
  if (report.targetType === REPORT_TARGETS.COMMENT) {
    const comment = await Comment.findById(report.targetId)
      .select('body status author')
      .populate('author', 'name')
      .lean();
    return {
      ...report,
      target: comment ? { ...comment, preview: comment.body.slice(0, 160) } : null,
    };
  }
  return { ...report, target: null };
}

async function resolveReport({ reportId, user, status, resolutionNote = '' }) {
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound('That report no longer exists');
  if (report.status !== REPORT_STATUS.OPEN)
    throw ApiError.badRequest('That report is already closed');

  report.status = status;
  report.resolvedBy = user._id;
  report.resolvedAt = new Date();
  report.resolutionNote = resolutionNote;
  await report.save();

  await notify({
    recipient: report.reporter,
    actor: user._id,
    community: report.community,
    type: NOTIFICATION_TYPES.REPORT_RESOLVED,
    message:
      status === REPORT_STATUS.RESOLVED
        ? 'Thanks — a moderator acted on your report'
        : 'A moderator reviewed your report and took no action',
    link: '/notifications',
  });

  return report;
}

module.exports = { createReport, listReports, resolveReport };
