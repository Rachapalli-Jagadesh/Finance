/**
 * Uniform response envelope helpers.
 * Every response follows the shape:
 *   { success, message, data?, meta?, errors? }
 */

function success(res, data = null, message = "OK", statusCode = 200, meta = null) {
  const body = { success: true, message };
  if (data !== null) body.data = data;
  if (meta !== null) body.meta = meta;
  return res.status(statusCode).json(body);
}

function created(res, data, message = "Created successfully") {
  return success(res, data, message, 201);
}

function error(res, message = "An error occurred", statusCode = 500, errors = null) {
  const body = { success: false, message };
  if (errors) body.errors = errors;
  return res.status(statusCode).json(body);
}

function notFound(res, message = "Resource not found") {
  return error(res, message, 404);
}

function forbidden(res, message = "You do not have permission to perform this action") {
  return error(res, message, 403);
}

function unauthorized(res, message = "Authentication required") {
  return error(res, message, 401);
}

function badRequest(res, message = "Invalid request", errors = null) {
  return error(res, message, 400, errors);
}

module.exports = { success, created, error, notFound, forbidden, unauthorized, badRequest };
