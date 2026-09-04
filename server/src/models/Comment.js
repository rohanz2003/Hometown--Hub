/**
 * models/Comment.js — a reply on a post.
 *
 * Supports one level of threading via `parent`; the API returns a flat list plus
 * the parent id so the client can render either a flat or a threaded view
 * (phases.doc.md Phase 3).
 */
const mongoose = require('mongoose');
const { POST_STATUS } = require('../utils/constants');

const commentSchema = new mongoose.Schema(
  {
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
      index: true,
    },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    body: {
      type: String,
      required: [true, 'Comment cannot be empty'],
      trim: true,
      minlength: 1,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: Object.values(POST_STATUS),
      default: POST_STATUS.PUBLISHED,
      index: true,
    },
    likes: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], default: [] },
    likeCount: { type: Number, default: 0, min: 0 },
    editedAt: { type: Date, default: null },
    moderation: {
      actionBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      actionAt: { type: Date, default: null },
      reason: { type: String, trim: true, maxlength: 300, default: '' },
    },
  },
  { timestamps: true },
);

commentSchema.index({ post: 1, status: 1, createdAt: 1 });

commentSchema.pre('save', function syncLikeCount(next) {
  if (this.isModified('likes')) this.likeCount = this.likes.length;
  next();
});

module.exports = mongoose.model('Comment', commentSchema);
