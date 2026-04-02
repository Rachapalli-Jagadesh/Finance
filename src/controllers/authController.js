const { login } = require("../services/authService");
const { success, error } = require("../utils/response");

async function loginHandler(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await login({ email, password });
    return success(res, result, "Login successful");
  } catch (err) {
    next(err);
  }
}

async function meHandler(req, res) {
  return success(res, req.user, "Current user");
}

module.exports = { loginHandler, meHandler };
