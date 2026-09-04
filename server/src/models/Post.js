/**
 * models/Post.js — a text/image update inside one community.
 *
 * Likes are stored as a user-id array (bounded by community size and cheap to
 * check for "did I like this?") plus a denormalised count for sorting by
 * popularity without an aggregation.
 */
const mongoose = require('mongoose');
const { POST_STATUS, POST_TYPES } = require('../utils/constants');

const postSchema = new mongoose.Schema(
  {
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
      index: true,
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, trim: true, maxlength: 160, default: '' },
    body: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      minlength: 1,
      maxlength: 5000,
    },
    type: {
      type: String,
      enum: Object.values(POST_TYPES),
      default: POST_TYPES.DISCUSSION,
      index: true,
    },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
    tags: { type: [{ type: String, trim: true, lowercase: true, maxlength: 30 }], default: [] },
    imageUrl: { type: String, trim: true, default: '' },
    imageAlt: { type: String, trim: true, maxlength: 160, default: '' },
    status: {
      type: String,
      enum: Object.values(POST_STATUS),
      default: POST_STATUS.PUBLISHED,
      index: true,
    },
    isPinned: { type: Boolean, default: false },
    pinnedAt: { type: Date, default: null },
    pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    likes: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
    likeCount: { type: Number, default: 0, min: 0 },
    commentCount: { type: Number, default: 0, min: 0 },
    shareCount: { type: Number, default: 0, min: 0 },
    editedAt: { type: Date, default: null },
    moderation: {
      actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      actionAt: { type: Date, default: null },
      reason: { type: String, trim: true, maxlength: 300, default: '' },
    },
  },
  { timestamps: true },
);

// Feed query: newest published posts in a community, pinned first.
postSchema.index({ community: 1, status: 1, isPinned: -1, createdAt: -1 });
postSchema.index({ community: 1, status: 1, likeCount: -1, createdAt: -1 });
postSchema.index({ title: 'text', body: 'text', tags: 'text' });

/** Keeps `likeCount` in step with the `likes` array on every save. */
postSchema.pre('save', function syncLikeCount(next) {
  if (this.isModified('likes')) this.likeCount = this.likes.length;
  next();
});

postSchema.methods.isLikedBy = function isLikedBy(userId) {
  if (!userId) return false;
  return this.likes.some((id) => String(id) === String(userId));
};

module.exports = mongoose.model('Post', postSchema);
