/**
 * services/membershipService.js — joining, leaving, and moderating members.
 *
 * Covers the moderator tools from phases.doc.md Phase 4: approve/reject members,
 * promote moderators, and remove or ban people.
 */
const Community = require('../models/Community');
const Membership = require('../models/Membership');
const ApiError = require('../utils/ApiError');
const { parsePagination, buildPageMeta } = require('../utils/pagination');
const { notify, notifyModerators } = require('./notificationService');
const {
  COMMUNITY_ROLES,
  COMMUNITY_STATUS,
  MEMBERSHIP_STATUS,
  NOTIFICATION_TYPES,
} = require('../utils/constants');

/** Recomputes the denormalised member counter from the source of truth. */
async function syncMemberCount(communityId) {
  const memberCount = await Membership.countDocuments({
    community: communityId,
    status: MEMBERSHIP_STATUS.APPROVED,
  });
  await Community.findByIdAndUpdate(communityId, { memberCount });
  return memberCount;
}

/**
 * Joins a community, or files a join request when it requires approval.
 * Re-joining after leaving reuses the existing membership row.
 */
async function join({ community, user, joinMessage = '' }) {
  if (community.status !== COMMUNITY_STATUS.APPROVED) {
    throw ApiError.forbidden('This community is not open yet');
  }

  const existing = await Membership.findOne({ user: user._id, community: community._id });
  if (existing) {
    if (existing.status === MEMBERSHIP_STATUS.BANNED) {
      throw ApiError.forbidden('You cannot rejoin this community');
    }
    if (existing.status === MEMBERSHIP_STATUS.APPROVED) {
      throw ApiError.conflict("You're already a member of this community");
    }
    if (existing.status === MEMBERSHIP_STATUS.PENDING) {
      throw ApiError.conflict('Your join request is still awaiting approval');
    }
  }

  const needsApproval = community.requiresApproval || community.visibility === 'private';
  const status = needsApproval ? MEMBERSHIP_STATUS.PENDING : MEMBERSHIP_STATUS.APPROVED;

  const membership = existing || new Membership({ user: user._id, community: community._id });
  membership.status = status;
  membership.role = COMMUNITY_ROLES.MEMBER;
  membership.joinMessage = joinMessage;
  membership.joinedAt = new Date();
  membership.reviewedBy = null;
  membership.reviewedAt = null;
  await membership.save();

  if (status === MEMBERSHIP_STATUS.APPROVED) {
    await syncMemberCount(community._id);
  } else {
    await notifyModerators({
      community: community._id,
      actor: user._id,
      type: NOTIFICATION_TYPES.MEMBER_REQUEST,
      message: `${user.name} asked to join ${community.name}`,
      link: `/communities/${community.slug}?tab=members`,
    });
  }

  return membership;
}

async function leave({ community, userId }) {
  const membership = await Membership.findOne({ user: userId, community: community._id });
  if (!membership) throw ApiError.badRequest("You're not a member of this community");

  const isLastAdmin =
    membership.role === COMMUNITY_ROLES.ADMIN &&
    (await Membership.countDocuments({
      community: community._id,
      role: COMMUNITY_ROLES.ADMIN,
      status: MEMBERSHIP_STATUS.APPROVED,
    })) === 1;

  if (isLastAdmin) {
    throw ApiError.badRequest('Promote another admin before you leave this community');
  }

  await membership.deleteOne();
  await syncMemberCount(community._id);
}

/** Paginated member list, filterable by status (e.g. pending requests). */
async function listMembers({ community, query = {} }) {
  const { page, limit, skip } = parsePagination(query);
  const filter = { community: community._id };
  if (query.status) filter.status = query.status;
  if (query.role) filter.role = query.role;

  const [items, total] = await Promise.all([
    Membership.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('user', 'name email avatarUrl hometown')
      .lean(),
    Membership.countDocuments(filter),
  ]);

  return { items, meta: buildPageMeta({ page, limit, total }) };
}

/** Approves or rejects a pending join request. */
async function reviewJoinRequest({ community, membershipId, action, reviewer }) {
  const membership = await Membership.findOne({
    _id: membershipId,
    community: community._id,
  }).populate('user', 'name');
  if (!membership) throw ApiError.notFound('That request no longer exists');
  if (membership.status !== MEMBERSHIP_STATUS.PENDING) {
    throw ApiError.badRequest('That request has already been reviewed');
  }

  const approved = action === 'approve';
  membership.status = approved ? MEMBERSHIP_STATUS.APPROVED : MEMBERSHIP_STATUS.REJECTED;
  membership.reviewedBy = reviewer._id;
  membership.reviewedAt = new Date();
  await membership.save();
  await syncMemberCount(community._id);

  await notify({
    recipient: membership.user._id,
    actor: reviewer._id,
    community: community._id,
    type: approved ? NOTIFICATION_TYPES.MEMBER_APPROVED : NOTIFICATION_TYPES.MEMBER_REJECTED,
    message: approved
      ? `You're in! Welcome to ${community.name}.`
      : `Your request to join ${community.name} was not approved.`,
    link: `/communities/${community.slug}`,
  });

  return membership;
}

/** Promotes or demotes a member. Only a community admin may do this. */
async function setMemberRole({ community, membershipId, role, actor }) {
  const membership = await Membership.findOne({ _id: membershipId, community: community._id });
  if (!membership) throw ApiError.notFound('That member could not be found');
  if (String(membership.user) === String(actor._id)) {
    throw ApiError.badRequest('You cannot change your own role');
  }
  if (membership.status !== MEMBERSHIP_STATUS.APPROVED) {
    throw ApiError.badRequest('Approve this member before changing their role');
  }

  membership.role = role;
  await membership.save();
  return membership;
}

/** Removes a member, optionally banning them from rejoining. */
async function removeMember({ community, membershipId, ban = false, actor }) {
  const membership = await Membership.findOne({ _id: membershipId, community: community._id });
  if (!membership) throw ApiError.notFound('That member could not be found');
  if (String(membership.user) === String(actor._id)) {
    throw ApiError.badRequest('Use "leave community" to remove yourself');
  }
  if (membership.role === COMMUNITY_ROLES.ADMIN) {
    throw ApiError.forbidden('Community admins cannot be removed by a moderator');
  }

  if (ban) {
    membership.status = MEMBERSHIP_STATUS.BANNED;
    membership.reviewedBy = actor._id;
    membership.reviewedAt = new Date();
    await membership.save();
  } else {
    await membership.deleteOne();
  }

  await syncMemberCount(community._id);
  return { banned: ban };
}

module.exports = {
  join,
  leave,
  listMembers,
  reviewJoinRequest,
  setMemberRole,
  removeMember,
  syncMemberCount,
};
