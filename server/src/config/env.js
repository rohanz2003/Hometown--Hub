/**
 * config/env.js — loads and validates environment configuration.
 *
 * Every environment value the app depends on is read exactly once, here, and
 * validated with zod so the process fails loudly at boot instead of producing
 * confusing runtime errors later.
 */
const path = require('path');
const dotenv = require('dotenv');
const { z } = require('zod');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const isTest = process.env.NODE_ENV === 'test';

// In test/development we fall back to safe local defaults so the project runs
// straight after clone. Production must supply real secrets.
const DEV_ACCESS_SECRET = 'dev-only-access-secret-do-not-use-in-production';
const DEV_REFRESH_SECRET = 'dev-only-refresh-secret-do-not-use-in-production';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  // Hosting platforms (Render, Heroku) inject PORT. SERVER_PORT wins when set, so a
  // PORT exported for another process in the same shell cannot steal the API's port.
  PORT: z.coerce.number().int().positive().optional(),
  SERVER_PORT: z.coerce.number().int().positive().optional(),
  CLIENT_ORIGINS: z.string().default('http://localhost:5173'),
  CLIENT_URL: z.string().url().default('http://localhost:5173'),
  MONGODB_URI: z.string().min(1).default('mongodb://127.0.0.1:27017/hometown_hub'),
  MONGODB_URI_TEST: z.string().min(1).default('mongodb://127.0.0.1:27017/hometown_hub_test'),
  JWT_ACCESS_SECRET: z.string().min(16).default(DEV_ACCESS_SECRET),
  JWT_REFRESH_SECRET: z.string().min(16).default(DEV_REFRESH_SECRET),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  BCRYPT_ROUNDS: z.coerce
    .number()
    .int()
    .min(4)
    .max(15)
    .default(isTest ? 4 : 10),
  UPLOAD_DIR: z.string().default('uploads'),
  MAX_UPLOAD_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 1024 * 1024),
  PLATFORM_ADMIN_EMAIL: z.string().email().optional(),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  const details = parsed.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

const raw = parsed.data;

if (raw.NODE_ENV === 'production') {
  const weak = [];
  if (raw.JWT_ACCESS_SECRET === DEV_ACCESS_SECRET) weak.push('JWT_ACCESS_SECRET');
  if (raw.JWT_REFRESH_SECRET === DEV_REFRESH_SECRET) weak.push('JWT_REFRESH_SECRET');
  if (weak.length) {
    throw new Error(
      `Refusing to start in production with development defaults: ${weak.join(', ')}`,
    );
  }
}

const env = {
  ...raw,
  PORT: raw.SERVER_PORT ?? raw.PORT ?? 5000,
  isProduction: raw.NODE_ENV === 'production',
  isTest: raw.NODE_ENV === 'test',
  isDevelopment: raw.NODE_ENV === 'development',
  // Tests get their own database so a test run can never wipe dev data.
  mongoUri: raw.NODE_ENV === 'test' ? raw.MONGODB_URI_TEST : raw.MONGODB_URI,
  clientOrigins: raw.CLIENT_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  uploadPath: path.resolve(__dirname, '../..', raw.UPLOAD_DIR),
};

module.exports = env;
