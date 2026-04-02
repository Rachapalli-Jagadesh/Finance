const { validationResult } = require("express-validator");
const { badRequest } = require("../utils/response");

/**
 * Runs after express-validator checks and returns 400 if any fail.
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map((e) => ({
      field: e.path,
      message: e.msg,
    }));
    return badRequest(res, "Validation failed", formatted);
  }
  next();
}

module.exports = { validate };
