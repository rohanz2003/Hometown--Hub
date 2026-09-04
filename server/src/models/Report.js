/**
 * models/Report.js — abuse report raised by a member.
 *
 * Community moderators see reports for their own community; platform admins see
 * every report (phases.doc.md Phase 4).
 */
const mongoose = require('mongoose');
const { REPORT_TARGETS, REPORT_STATUS } = require('../utils/constants');

const reportSchema = new mongoose.Schema(
  {
    reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    targetType: { type: String, enum: Object.values(REPORT_TARGETS), required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      default: null,
      index: true,
    },
    reason: { type: String, required: true, trim: true, minlength: 5, maxlength: 500 },
    status: {
      type: String,
      enum: Object.values(REPORT_STATUS),
      default: REPORT_STATUS.OPEN,
      index: true,
    },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
    resolutionNote: { type: String, trim: true, maxlength: 400, default: '' },
  },
  { timestamps: true },
);

// A member can only report the same thing once.
reportSchema.index({ reporter: 1, targetType: 1, targetId: 1 }, { unique: true });

module.exports = mongoose.model('Report', reportSchema);
