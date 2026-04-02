const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { get, run } = require("../database");

const SALT_ROUNDS = 10;

/**
 * Register a new user.
 * Only admins can create users via the /users route.
 * This service is also used for the initial admin seed.
 */
async function createUser({ name, email, password, role = "viewer" }) {
  const existing = get("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
  if (existing) {
    const err = new Error("Email already registered");
    err.status = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const id = uuidv4();

  run(
    `INSERT INTO users (id, name, email, password, role, status)
     VALUES (?, ?, ?, ?, ?, 'active')`,
    [id, name.trim(), email.toLowerCase(), hashed, role]
  );

  return getSafeUser(id);
}

/**
 * Authenticate a user and return a signed JWT.
 */
async function login({ email, password }) {
  const user = get("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
  if (!user) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  if (user.status === "inactive") {
    const err = new Error("Account is inactive. Contact an admin.");
    err.status = 403;
    throw err;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error("Invalid email or password");
    err.status = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "24h" }
  );

  return { token, user: stripPassword(user) };
}

function getSafeUser(id) {
  const user = get("SELECT * FROM users WHERE id = ?", [id]);
  return user ? stripPassword(user) : null;
}

function stripPassword(user) {
  const { password, ...safe } = user;
  return safe;
}

module.exports = { createUser, login, getSafeUser };
