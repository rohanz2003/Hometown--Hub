/**
 * models/Category.js — content categories/tags managed by platform admins
 * (phases.doc.md Phase 4) and used to filter posts and events.
 */
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    description: { type: String, trim: true, maxlength: 300, default: '' },
    /** Which surfaces this category may be applied to. */
    appliesTo: {
      type: [{ type: String, enum: ['post', 'event'] }],
      default: ['post', 'event'],
    },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true },
);

categorySchema.statics.toSlug = (value) =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60);

module.exports = mongoose.model('Category', categorySchema);
