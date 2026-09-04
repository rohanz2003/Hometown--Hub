/**
 * utils/logger.js — tiny structured logger.
 *
 * Deliberately dependency-free. Never log passwords, tokens, or full request
 * bodies (see rules.md § Security & privacy).
 */
const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const activeLevel = (() => {
  if (process.env.LOG_LEVEL && process.env.LOG_LEVEL in LEVELS) return process.env.LOG_LEVEL;
  if (process.env.NODE_ENV === 'test') return 'error';
  if (process.env.NODE_ENV === 'production') return 'info';
  return 'debug';
})();

function write(level, message, meta) {
  if (LEVELS[level] > LEVELS[activeLevel]) return;
  const line = { level, time: new Date().toISOString(), message };
  if (meta && Object.keys(meta).length > 0) line.meta = meta;
  // eslint-disable-next-line no-console -- stdout/stderr is this logger's transport
  const target = level === 'error' ? console.error : console.log;
  target(JSON.stringify(line));
}

module.exports = {
  error: (message, meta) => write('error', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  info: (message, meta) => write('info', message, meta),
  debug: (message, meta) => write('debug', message, meta),
  level: activeLevel,
};
