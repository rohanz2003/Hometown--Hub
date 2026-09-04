/**
 * utils/validators.js — zod schemas shared by the forms.
 *
 * Mirrors the backend rules so the user gets immediate feedback; the server
 * remains the authority and its field errors are merged into the form on submit.
 */
import { z } from 'zod';

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[a-z]/i, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

export const loginSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
  password: z.string().min(1, 'Enter your password'),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Enter your full name').max(80),
    email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
    phone: z
      .string()
      .trim()
      .regex(/^[+\d][\d\s-]*$/, 'Enter a valid phone number')
      .optional()
      .or(z.literal('')),
    password,
    confirmPassword: z.string(),
    city: z.string().trim().min(1, 'Tell us your hometown city or village').max(120),
    state: z.string().trim().max(120).optional().or(z.literal('')),
    country: z.string().trim().max(120).optional().or(z.literal('')),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Those passwords do not match',
  });

export const forgotPasswordSchema = z.object({
  email: z.string().trim().min(1, 'Enter your email').email('Enter a valid email address'),
});

export const resetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Those passwords do not match',
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Enter your current password'),
    newPassword: password,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Those passwords do not match',
  });

export const communitySchema = z.object({
  name: z.string().trim().min(3, 'Give the community a name of at least 3 characters').max(100),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  city: z.string().trim().min(1, 'Which city or village is this for?').max(120),
  state: z.string().trim().max(120).optional().or(z.literal('')),
  country: z.string().trim().max(120).optional().or(z.literal('')),
  visibility: z.enum(['public', 'private']),
  requiresApproval: z.boolean(),
  tagsText: z.string().trim().max(200).optional().or(z.literal('')),
});

export const postSchema = z.object({
  title: z.string().trim().max(160).optional().or(z.literal('')),
  body: z.string().trim().min(1, 'Write something to share').max(5000),
  type: z.string(),
  category: z.string().optional().or(z.literal('')),
  tagsText: z.string().trim().max(200).optional().or(z.literal('')),
  imageAlt: z.string().trim().max(160).optional().or(z.literal('')),
});

export const commentSchema = z.object({
  body: z.string().trim().min(1, 'Write a comment').max(2000),
});

export const eventSchema = z
  .object({
    title: z.string().trim().min(3, 'Give the event a clear title').max(160),
    description: z.string().trim().max(3000).optional().or(z.literal('')),
    startsAt: z.string().min(1, 'When does it start?'),
    endsAt: z.string().optional().or(z.literal('')),
    isAllDay: z.boolean(),
    venue: z.string().trim().max(200).optional().or(z.literal('')),
    address: z.string().trim().max(300).optional().or(z.literal('')),
    city: z.string().trim().max(120).optional().or(z.literal('')),
    isOnline: z.boolean(),
    meetingUrl: z.string().trim().max(500).optional().or(z.literal('')),
    capacity: z.coerce.number().int().min(0).max(100000),
  })
  .refine((data) => !data.endsAt || new Date(data.endsAt) > new Date(data.startsAt), {
    path: ['endsAt'],
    message: 'The end time must be after the start time',
  })
  .refine((data) => !data.isOnline || data.meetingUrl.length > 0, {
    path: ['meetingUrl'],
    message: 'Add the meeting link for an online event',
  });

export const profileSchema = z.object({
  name: z.string().trim().min(2, 'Enter your full name').max(80),
  phone: z
    .string()
    .trim()
    .regex(/^[+\d][\d\s-]*$/, 'Enter a valid phone number')
    .optional()
    .or(z.literal('')),
  bio: z.string().trim().max(400).optional().or(z.literal('')),
  city: z.string().trim().min(1, 'Tell us your hometown city or village').max(120),
  district: z.string().trim().max(120).optional().or(z.literal('')),
  state: z.string().trim().max(120).optional().or(z.literal('')),
  country: z.string().trim().max(120).optional().or(z.literal('')),
  currentCity: z.string().trim().max(120).optional().or(z.literal('')),
});

export const reportSchema = z.object({
  reason: z.string().trim().min(5, 'Tell the moderators what is wrong').max(500),
});

/** Turns a comma-separated tag field into a clean array. */
export const parseTags = (text) =>
  String(text || '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 8);
