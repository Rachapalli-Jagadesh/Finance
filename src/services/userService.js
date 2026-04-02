const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");
const { get, all, run } = require("../database");

const SALT_ROUNDS = 10;

function stripPassword(user) {
  if (!user) return null;
  const { password, ...safe } = user;
  return safe;
}

/**
 * List all users with optional role/status filter and pagination.
 */
function listUsers({ role, status, page = 1, limit = 20 } = {}) {
  const conditions = [];
  const params = [];

  if (role) { conditions.push("role = ?"); params.push(role); }
  if (status) { conditions.push("status = ?"); params.push(status); }

  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  const offset = (page - 1) * limit;

  const users = all(
    `SELECT id, name, email, role, status, created_at, updated_at
     FROM users ${where}
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const total = get(`SELECT COUNT(*) as count FROM users ${where}`, params).count;

  return {
    users,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

/**
 * Get a single user by ID (no password).
 */
function getUserById(id) {
  const user = get(
    "SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = ?",
    [id]
  );
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  return user;
}

/**
 * Update user fields (admin only).
 */
async function updateUser(id, { name, email, role, status, password }) {
  const existing = get("SELECT * FROM users WHERE id = ?", [id]);
  if (!existing) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }

  if (email && email.toLowerCase() !== existing.email) {
    const conflict = get("SELECT id FROM users WHERE email = ? AND id != ?", [email.toLowerCase(), id]);
    if (conflict) {
      const err = new Error("Email already in use");
      err.status = 409;
      throw err;
    }
  }

  const updates = [];
  const params = [];

  if (name)   { updates.push("name = ?");   params.push(name.trim()); }
  if (email)  { updates.push("email = ?");  params.push(email.toLowerCase()); }
  if (role)   { updates.push("role = ?");   params.push(role); }
  if (status) { updates.push("status = ?"); params.push(status); }
  if (password) {
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    updates.push("password = ?");
    params.push(hashed);
  }

  if (!updates.length) {
    const err = new Error("No fields to update");
    err.status = 400;
    throw err;
  }

  updates.push("updated_at = datetime('now')");
  params.push(id);

  run(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params);
  return getUserById(id);
}

/**
 * Soft-delete a user by setting status = 'inactive'.
 */
function deactivateUser(id) {
  const user = get("SELECT id FROM users WHERE id = ?", [id]);
  if (!user) {
    const err = new Error("User not found");
    err.status = 404;
    throw err;
  }
  run("UPDATE users SET status = 'inactive', updated_at = datetime('now') WHERE id = ?", [id]);
  return getUserById(id);
}

module.exports = { listUsers, getUserById, updateUser, deactivateUser };
