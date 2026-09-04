/**
 * models/Community.js — one hometown, village, or city group.
 *
 * A community is created by a user but only becomes visible platform-wide once a
 * platform admin approves it (phases.doc.md Phase 3 / Phase 4).
 */
const mongoose = require('mongoose');
const { COMMUNITY_STATUS, COMMUNITY_VISIBILITY } = require('../utils/constants');

const locationSchema = new mongoose.Schema(
  {
    city: { type: String, required: true, trim: true, maxlength: 120 },
    district: { type: String, trim: true, maxlength: 120, default: '' },
    state: { type: String, trim: true, maxlength: 120, default: '' },
    country: { type: String, trim: true, maxlength: 120, default: '' },
  },
  { _id: false },
);

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Community name is required'],
      trim: true,
      minlength: 3,
      maxlength: 100,
    },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    location: { type: locationSchema, required: true },
    coverImageUrl: { type: String, trim: true, default: '' },
    // Community-specific rules set by the community admin/moderators.
    rules: {
      type: [
        {
          title: { type: String, trim: true, maxlength: 120 },
          body: { type: String, trim: true, maxlength: 600 },
        },
      ],
      default: [],
    },
    tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: {
      type: String,
      enum: Object.values(COMMUNITY_STATUS),
      default: COMMUNITY_STATUS.PENDING,
      index: true,
    },
    visibility: {
      type: String,
      enum: Object.values(COMMUNITY_VISIBILITY),
      default: COMMUNITY_VISIBILITY.PUBLIC,
    },
    /** Private communities queue join requests for moderator approval. */
    requiresApproval: { type: Boolean, default: false },
    // Denormalised counters so feed cards never need an aggregate per card.
    memberCount: { type: Number, default: 0, min: 0 },
    postCount: { type: Number, default: 0, min: 0 },
    eventCount: { type: Number, default: 0, min: 0 },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    reviewedAt: { type: Date, default: null },
    reviewNote: { type: String, trim: true, maxlength: 400, default: '' },
  },
  { timestamps: true },
);

communitySchema.index({ 'location.city': 1, status: 1 });
communitySchema.index({ name: 'text', description: 'text', 'location.city': 'text' });

/** URL-safe slug; a numeric suffix is appended by the service on collision. */
communitySchema.statics.toSlug = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);

communitySchema.methods.isApproved = function isApproved() {
  return this.status === COMMUNITY_STATUS.APPROVED;
};

module.exports = mongoose.model('Community', communitySchema);
