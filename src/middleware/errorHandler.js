const { error } = require("../utils/response");


// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  console.error("[ERROR]", err.stack || err.message);
  const statusCode = err.status || err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production" && statusCode === 500
      ? "Internal server error"
      : err.message || "Internal server error";

  return error(res, message, statusCode);
}

// 404 handler for unmatched routes.
function notFoundHandler(req, res) {
  return error(res, `Route ${req.method} ${req.path} not found`, 404);
}

module.exports = { errorHandler, notFoundHandler };
