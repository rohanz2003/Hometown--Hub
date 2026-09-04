/**
 * controllers/notificationController.js — in-app notification endpoints.
 */
const Notification = require('../models/Notification');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { parsePagination, buildPageMeta } = require('../utils/pagination');

const list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter = { recipient: req.user._id };
  if (req.query.unreadOnly) filter.isRead = false;

  const [items, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('actor', 'name avatarUrl')
      .populate('community', 'name slug')
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  ]);

  return sendSuccess(res, items, {
    meta: { ...buildPageMeta({ page, limit, total }), unreadCount },
  });
});

const unreadCount = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    unreadCount: await Notification.countDocuments({ recipient: req.user._id, isRead: false }),
  }),
);

const markRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.notificationId, recipient: req.user._id },
    { isRead: true, readAt: new Date() },
    { new: true },
  );
  if (!notification) throw ApiError.notFound('That notification no longer exists');
  return sendSuccess(res, notification);
});

const markAllRead = asyncHandler(async (req, res) => {
  const result = await Notification.updateMany(
    { recipient: req.user._id, isRead: false },
    { isRead: true, readAt: new Date() },
  );
  return sendSuccess(res, { updated: result.modifiedCount || 0 });
});

const remove = asyncHandler(async (req, res) => {
  const deleted = await Notification.findOneAndDelete({
    _id: req.params.notificationId,
    recipient: req.user._id,
  });
  if (!deleted) throw ApiError.notFound('That notification no longer exists');
  return sendSuccess(res, { message: 'Notification dismissed' });
});

module.exports = { list, unreadCount, markRead, markAllRead, remove };
