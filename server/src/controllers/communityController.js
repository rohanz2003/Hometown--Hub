/**
 * controllers/communityController.js — community and membership endpoints.
 */
const communityService = require('../services/communityService');
const membershipService = require('../services/membershipService');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess } = require('../utils/response');
const { PLATFORM_ROLES } = require('../utils/constants');

const isPlatformAdmin = (req) =>
  Boolean(req.user) && req.user.role === PLATFORM_ROLES.PLATFORM_ADMIN;

const list = asyncHandler(async (req, res) => {
  const { items, meta } = await communityService.listCommunities({
    query: req.query,
    isPlatformAdmin: isPlatformAdmin(req),
    userId: req.user?._id,
  });
  return sendSuccess(res, items, { meta });
});

/** Communities the signed-in user has joined or applied to. */
const mine = asyncHandler(async (req, res) =>
  sendSuccess(res, await communityService.myCommunities(req.user._id)),
);

const create = asyncHandler(async (req, res) => {
  const community = await communityService.createCommunity({
    userId: req.user._id,
    data: req.body,
  });
  return sendSuccess(
    res,
    {
      community,
      message: 'Community created — a platform admin will review it shortly.',
    },
    { status: 201 },
  );
});

const detail = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await communityService.getCommunity({ community: req.community, userId: req.user?._id }),
  ),
);

const update = asyncHandler(async (req, res) =>
  sendSuccess(
    res,
    await communityService.updateCommunity({ community: req.community, data: req.body }),
  ),
);

const remove = asyncHandler(async (req, res) => {
  await communityService.deleteCommunity(req.community);
  return sendSuccess(res, { message: 'Community deleted' });
});

/* ── Membership ────────────────────────────────────────────────────────────── */

const join = asyncHandler(async (req, res) => {
  const membership = await membershipService.join({
    community: req.community,
    user: req.user,
    joinMessage: req.body.joinMessage,
  });
  const pending = membership.status === 'pending';
  return sendSuccess(
    res,
    {
      status: membership.status,
      role: membership.role,
      message: pending
        ? 'Your request was sent to the moderators'
        : `Welcome to ${req.community.name}!`,
    },
    { status: 201 },
  );
});

const leave = asyncHandler(async (req, res) => {
  await membershipService.leave({ community: req.community, userId: req.user._id });
  return sendSuccess(res, { message: `You've left ${req.community.name}` });
});

const members = asyncHandler(async (req, res) => {
  const { items, meta } = await membershipService.listMembers({
    community: req.community,
    query: req.query,
  });
  return sendSuccess(res, items, { meta });
});

const reviewMember = asyncHandler(async (req, res) => {
  const membership = await membershipService.reviewJoinRequest({
    community: req.community,
    membershipId: req.params.membershipId,
    action: req.body.action,
    reviewer: req.user,
  });
  return sendSuccess(res, { status: membership.status });
});

const setMemberRole = asyncHandler(async (req, res) => {
  const membership = await membershipService.setMemberRole({
    community: req.community,
    membershipId: req.params.membershipId,
    role: req.body.role,
    actor: req.user,
  });
  return sendSuccess(res, { role: membership.role });
});

const removeMember = asyncHandler(async (req, res) => {
  const result = await membershipService.removeMember({
    community: req.community,
    membershipId: req.params.membershipId,
    ban: req.body.ban,
    actor: req.user,
  });
  return sendSuccess(res, {
    message: result.banned ? 'Member banned from this community' : 'Member removed',
  });
});

module.exports = {
  list,
  mine,
  create,
  detail,
  update,
  remove,
  join,
  leave,
  members,
  reviewMember,
  setMemberRole,
  removeMember,
};
