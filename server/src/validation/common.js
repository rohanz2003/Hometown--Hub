/**
 * validation/common.js — reusable zod building blocks.
 */
const { z } = require('zod');
const { SORT_OPTIONS } = require('../utils/constants');

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'That id is not valid');

/** Accepts either a Mongo id or a URL slug (community routes support both). */
const idOrSlug = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-z\d-]+$/i, 'That identifier is not valid');

const email = z.string().trim().toLowerCase().email('Enter a valid email address').max(160);

const password = z
  .string()
  .min(8, 'Use at least 8 characters')
  .max(128, 'That password is too long')
  .regex(/[a-z]/i, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');

const phone = z
  .string()
  .trim()
  .max(20)
  .regex(/^[+\d][\d\s-]*$/, 'Enter a valid phone number')
  .optional()
  .or(z.literal(''));

const hometown = z.object({
  city: z.string().trim().min(1, 'Tell us your hometown city or village').max(120),
  district: z.string().trim().max(120).optional().default(''),
  state: z.string().trim().max(120).optional().default(''),
  country: z.string().trim().max(120).optional().default(''),
  currentCity: z.string().trim().max(120).optional().default(''),
});

const tags = z
  .array(z.string().trim().toLowerCase().min(1).max(30))
  .max(8, 'Up to 8 tags')
  .optional()
  .default([]);

/** `?page=&limit=` shared by every list endpoint. */
const pagination = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

const sort = z.enum(Object.values(SORT_OPTIONS)).optional().default(SORT_OPTIONS.RECENT);

/** Trimmed, length-bounded free text. */
const text = (min, max, label = 'This field') =>
  z
    .string()
    .trim()
    .min(min, min === 1 ? `${label} is required` : `${label} needs at least ${min} characters`)
    .max(max, `${label} must be ${max} characters or fewer`);

module.exports = {
  objectId,
  idOrSlug,
  email,
  password,
  phone,
  hometown,
  tags,
  pagination,
  sort,
  text,
};
