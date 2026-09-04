/**
 * validation/authSchemas.js — Phase 1 request schemas.
 */
const { z } = require('zod');
const { email, password, phone, hometown, text } = require('./common');

const registerSchema = z.object({
  name: text(2, 80, 'Name'),
  email,
  password,
  phone,
  hometown,
});

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Enter your password').max(128),
});

const forgotPasswordSchema = z.object({ email });

const resetPasswordSchema = z.object({
  email,
  token: z.string().trim().length(64, 'That reset link is invalid'),
  password,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password').max(128),
  newPassword: password,
});

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
};
