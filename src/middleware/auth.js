const jwt = require("jsonwebtoken");
const { get } = require("../database");
const { unauthorized, forbidden } = require("../utils/response");
const { PERMISSIONS } = require("../utils/constants");

/**
 * authenticate — verifies the JWT and attaches req.user.
 */
async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return unauthorized(res);
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = get(
      "SELECT id, name, email, role, status FROM users WHERE id = ?",
      [decoded.id]
    );

    if (!user) return unauthorized(res, "User no longer exists");
    if (user.status === "inactive") return forbidden(res, "Your account is inactive");

    req.user = user;
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") return unauthorized(res, "Token expired");
    return unauthorized(res, "Invalid token");
  }
}


function authorize(action) {
  return (req, res, next) => {
    const allowed = PERMISSIONS[action];
    if (!allowed) return forbidden(res, "Unknown permission action");

    if (!allowed.includes(req.user.role)) {
      return forbidden(res, `Role '${req.user.role}' cannot perform '${action}'`);
    }
    next();
  };
}

module.exports = { authenticate, authorize };
