/**
 * middleware/validate.js — request validation with zod.
 *
 * No route reads `req.body` without passing through here first
 * (rules.md § "No skipping input validation on backend routes").
 * Validated output replaces the raw input, so handlers only ever see
 * coerced, trimmed, whitelisted values.
 */
const ApiError = require('../utils/ApiError');

const SOURCES = ['body', 'query', 'params'];

function formatIssues(error) {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

/**
 * @param {{body?: import('zod').ZodTypeAny, query?: import('zod').ZodTypeAny,
 *          params?: import('zod').ZodTypeAny}} schemas
 */
function validate(schemas) {
  return (req, res, next) => {
    const details = [];

    SOURCES.forEach((source) => {
      const schema = schemas[source];
      if (!schema) return;
      const result = schema.safeParse(req[source]);
      if (result.success) {
        // `req.query` is a getter on some Express versions — assign defensively.
        if (source === 'query') {
          req.validatedQuery = result.data;
          Object.keys(result.data).forEach((key) => {
            req.query[key] = result.data[key];
          });
        } else {
          req[source] = result.data;
        }
      } else {
        details.push(...formatIssues(result.error).map((d) => ({ ...d, in: source })));
      }
    });

    if (details.length > 0) {
      return next(
        ApiError.badRequest('Some fields need attention', { code: 'VALIDATION_ERROR', details }),
      );
    }
    return next();
  };
}

module.exports = validate;
