/**
 * models/User.js — platform account.
 *
 * Holds identity, hometown details, platform role, and the per-user UI
 * preferences that design.md § 4 requires to persist across devices.
 * Passwords are stored only as bcrypt hashes and are never selected by default.
 */
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const env = require('../config/env');
const { PLATFORM_ROLES } = require('../utils/constants');

const preferencesSchema = new mongoose.Schema(
  {
    theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
    language: { type: String, default: 'en', maxlength: 10 },
    sidebarCollapsed: { type: Boolean, default: false },
    feedView: { type: String, enum: ['list', 'grid'], default: 'list' },
    defaultCommunity: { type: mongoose.Schema.Types.ObjectId, ref: 'Community', default: null },
    emailNotifications: { type: Boolean, default: true },
  },
  { _id: false },
);

const hometownSchema = new mongoose.Schema(
  {
    city: { type: String, trim: true, maxlength: 120, default: '' },
    district: { type: String, trim: true, maxlength: 120, default: '' },
    state: { type: String, trim: true, maxlength: 120, default: '' },
    country: { type: String, trim: true, maxlength: 120, default: '' },
    // Set when someone has moved away but still follows their hometown.
    currentCity: { type: String, trim: true, maxlength: 120, default: '' },
  },
  { _id: false },
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address'],
    },
    phone: { type: String, trim: true, maxlength: 20, default: '' },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(PLATFORM_ROLES),
      default: PLATFORM_ROLES.USER,
      index: true,
    },
    hometown: { type: hometownSchema, default: () => ({}) },
    bio: { type: String, trim: true, maxlength: 400, default: '' },
    avatarUrl: { type: String, trim: true, default: '' },
    preferences: { type: preferencesSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    lastLoginAt: { type: Date, default: null },
    // Bumped on password change / logout-everywhere to invalidate refresh tokens.
    tokenVersion: { type: Number, default: 0 },
    passwordResetTokenHash: { type: String, default: null, select: false },
    passwordResetExpiresAt: { type: Date, default: null, select: false },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } },
);

userSchema.index({ 'hometown.city': 1 });
userSchema.index({ name: 'text', 'hometown.city': 'text' });

/** Hash the password whenever it is set through `user.password = '...'`. */
userSchema.virtual('password').set(function setPassword(plain) {
  this.$locals.plainPassword = plain;
});

// Hashing runs on `validate`, not `save`: Mongoose registers its own validation
// as the first pre-save hook, so hashing later would fail the `required` check.
userSchema.pre('validate', async function hashPassword(next) {
  const plain = this.$locals.plainPassword;
  if (!plain) return next();
  this.passwordHash = await bcrypt.hash(plain, env.BCRYPT_ROUNDS);
  this.$locals.plainPassword = undefined;
  return next();
});

userSchema.methods.comparePassword = function comparePassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.isPlatformAdmin = function isPlatformAdmin() {
  return this.role === PLATFORM_ROLES.PLATFORM_ADMIN;
};

/**
 * Creates a single-use reset token. Only the SHA-256 hash is stored, so a
 * database leak cannot be replayed against the reset endpoint.
 */
userSchema.methods.createPasswordResetToken = function createPasswordResetToken(ttlMinutes = 30) {
  const raw = crypto.randomBytes(32).toString('hex');
  this.passwordResetTokenHash = crypto.createHash('sha256').update(raw).digest('hex');
  this.passwordResetExpiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
  return raw;
};

userSchema.statics.hashResetToken = (raw) =>
  crypto.createHash('sha256').update(String(raw)).digest('hex');

/** Public projection — never leaks hashes or reset tokens. */
userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    role: this.role,
    hometown: this.hometown,
    bio: this.bio,
    avatarUrl: this.avatarUrl,
    preferences: this.preferences,
    isActive: this.isActive,
    createdAt: this.createdAt,
    lastLoginAt: this.lastLoginAt,
  };
};

module.exports = mongoose.model('User', userSchema);
