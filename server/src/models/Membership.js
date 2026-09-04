/**
 * models/Membership.js — join table for "user belongs to community".
 *
 * Also carries the per-community role, which is how moderators exist
 * (architecture.md lists Moderators as an entity): a moderator is simply a
 * membership whose role is `moderator` or `admin`.
 */
const mongoose = require('mongoose');
const { COMMUNITY_ROLES, COMMUNITY_ROLE_RANK, MEMBERSHIP_STATUS } = require('../utils/constants');

const membershipSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
      index: true,
    },
    role: { type: String, enum: Object.values(COMMUNITY_ROLES), default: COMMUNITY_ROLES.MEMBER },
    status: {
      type: String,
      enum: Object.values(MEMBERSHIP_STATUS),
      default: MEMBERSHIP_STATUS.APPROVED,
      index: true,
    },
    joinMessage: { type: String, trim: true, maxlength: 300, default: '' },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

// One membership row per user per community.
membershipSchema.index({ user: 1, community: 1 }, { unique: true });
membershipSchema.index({ community: 1, status: 1, role: 1 });

membershipSchema.methods.isActive = function isActive() {
  return this.status === MEMBERSHIP_STATUS.APPROVED;
};

/** True when this membership's role is at least as privileged as `role`. */
membershipSchema.methods.hasAtLeast = function hasAtLeast(role) {
  return (COMMUNITY_ROLE_RANK[this.role] || 0) >= (COMMUNITY_ROLE_RANK[role] || 0);
};

module.exports = mongoose.model('Membership', membershipSchema);
