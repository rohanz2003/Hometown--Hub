/**
 * app.js — builds the Express application.
 *
 * Exported without starting a listener so integration tests can drive it with
 * supertest (`src/index.js` owns the listener and the DB connection).
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const routes = require('./routes');
const logger = require('./utils/logger');
const { sendSuccess } = require('./utils/response');
const { sanitizeRequest } = require('./middleware/sanitize');
const { globalLimiter } = require('./middleware/rateLimit');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  // Images are served cross-origin to the client dev server.
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin/curl requests send no Origin header — allow them through.
        if (!origin || env.clientOrigins.includes(origin)) return callback(null, true);
        return callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));
  app.use(cookieParser());
  app.use(sanitizeRequest);

  if (!env.isTest) {
    app.use(
      morgan('tiny', {
        stream: { write: (message) => logger.info(message.trim()) },
      }),
    );
  }

  app.use(globalLimiter);

  /** Liveness probe for the deployment platform. */
  app.get('/health', (req, res) =>
    sendSuccess(res, { status: 'ok', uptime: Math.round(process.uptime()), env: env.NODE_ENV }),
  );

  // Locally-uploaded images. Production should serve these from object storage.
  app.use('/uploads', express.static(env.uploadPath, { maxAge: '7d', fallthrough: true }));

  app.use('/api/v1', routes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = createApp;
