/**
 * controllers/userController.js — profile, preferences, public profiles, reports.
 */
const User = require('../models/User');
const Post = require('../models/Post');
const Membership = require('../models/Membership');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const reportService = require('../services/reportService');
const { MEMBERSHIP_STATUS, POST_STATUS } = require('../utils/constants');

const profile = asyncHandler(async (req, res) => sendSuccess(res, req.user.toPublicJSON()));

const updateProfile = asyncHandler(async (req, res) => {
  const { hometown, ...rest } = req.body;
  Object.assign(req.user, rest);
  if (hometown) req.user.hometown = { ...req.user.hometown.toObject(), ...hometown };
  if (req.uploadedImageUrl) req.user.avatarUrl = req.uploadedImageUrl;
  await req.user.save();
  return sendSuccess(res, req.user.toPublicJSON());
});

/**
 * Persists UI preferences on the profile so they follow the user across devices
 * (design.md § 4).
 */
const updatePreferences = asyncHandler(async (req, res) => {
  Object.entries(req.body).forEach(([key, value]) => {
    req.user.preferences[key] = value;
  });
  await req.user.save();
  return sendSuccess(res, req.user.preferences);
});

/** Public profile with hometown details and a short activity summary. */
const publicProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user || !user.isActive) throw ApiError.notFound('That profile is not available');

  const [postCount, communities] = await Promise.all([
    Post.countDocuments({ author: user._id, status: POST_STATUS.PUBLISHED }),
    Membership.find({ user: user._id, status: MEMBERSHIP_STATUS.APPROVED })
      .populate('community', 'name slug location.city visibility status')
      .lean(),
  ]);

  return sendSuccess(res, {
    id: user._id,
    name: user.name,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    hometown: user.hometown,
    createdAt: user.createdAt,
    postCount,
    // Private communities are not advertised on a public profile.
    communities: communities
      .filter(
        (m) =>
          m.community && m.community.visibility === 'public' && m.community.status === 'approved',
      )
      .map((m) => ({
        id: m.community._id,
        name: m.community.name,
        slug: m.community.slug,
        role: m.role,
      })),
  });
});

/** Deactivates the caller's own account. */
const deactivate = asyncHandler(async (req, res) => {
  req.user.isActive = false;
  req.user.tokenVersion += 1;
  await req.user.save();
  return sendSuccess(res, { message: 'Your account has been deactivated' });
});

const createReport = asyncHandler(async (req, res) => {
  await reportService.createReport({ reporter: req.user, ...req.body });
  return sendSuccess(res, { message: 'Thanks — a moderator will review this' }, { status: 201 });
});

module.exports = {
  profile,
  updateProfile,
  updatePreferences,
  publicProfile,
  deactivate,
  createReport,
};
