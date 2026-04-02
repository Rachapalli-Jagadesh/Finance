const { v4: uuidv4 } = require("uuid");
const { get, all, run } = require("../database");

/**
 * Create a new financial record.
 */
function createRecord({ userId, amount, type, category, date, notes }) {
  const id = uuidv4();
  run(
    `INSERT INTO financial_records (id, user_id, amount, type, category, date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, amount, type, category.toLowerCase(), date, notes || null]
  );
  return getRecordById(id);
}

/**
 * Get a single record by ID (non-deleted).
 */
function getRecordById(id) {
  const record = get(
    "SELECT * FROM financial_records WHERE id = ? AND deleted = 0",
    [id]
  );
  if (!record) {
    const err = new Error("Record not found");
    err.status = 404;
    throw err;
  }
  return record;
}

/**
 * List records with flexible filters and pagination.
 * Supports: type, category, startDate, endDate, userId, search (notes/category)
 */
function listRecords({
  type,
  category,
  startDate,
  endDate,
  userId,
  search,
  page = 1,
  limit = 20,
  sortBy = "date",
  sortDir = "DESC",
} = {}) {
  const conditions = ["deleted = 0"];
  const params = [];

  if (type)      { conditions.push("type = ?");           params.push(type); }
  if (category)  { conditions.push("category = ?");       params.push(category.toLowerCase()); }
  if (startDate) { conditions.push("date >= ?");          params.push(startDate); }
  if (endDate)   { conditions.push("date <= ?");          params.push(endDate); }
  if (userId)    { conditions.push("user_id = ?");        params.push(userId); }
  if (search)    {
    conditions.push("(notes LIKE ? OR category LIKE ?)");
    params.push(`%${search}%`, `%${search}%`);
  }

  const where = "WHERE " + conditions.join(" AND ");

  // Whitelist sort columns to prevent SQL injection
  const safeSortBy = ["date", "amount", "category", "type", "created_at"].includes(sortBy)
    ? sortBy : "date";
  const safeSortDir = sortDir.toUpperCase() === "ASC" ? "ASC" : "DESC";

  const offset = (page - 1) * limit;

  const records = all(
    `SELECT * FROM financial_records ${where}
     ORDER BY ${safeSortBy} ${safeSortDir}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  const total = get(
    `SELECT COUNT(*) as count FROM financial_records ${where}`,
    params
  ).count;

  return {
    records,
    pagination: { total, page, limit, pages: Math.ceil(total / limit) },
  };
}

/**
 * Update a record. Only admin can call this (enforced at route level).
 */
function updateRecord(id, { amount, type, category, date, notes }) {
  const existing = get(
    "SELECT id FROM financial_records WHERE id = ? AND deleted = 0",
    [id]
  );
  if (!existing) {
    const err = new Error("Record not found");
    err.status = 404;
    throw err;
  }

  const updates = [];
  const params = [];

  if (amount !== undefined)   { updates.push("amount = ?");   params.push(amount); }
  if (type)                   { updates.push("type = ?");     params.push(type); }
  if (category)               { updates.push("category = ?"); params.push(category.toLowerCase()); }
  if (date)                   { updates.push("date = ?");     params.push(date); }
  if (notes !== undefined)    { updates.push("notes = ?");    params.push(notes); }

  if (!updates.length) {
    const err = new Error("No fields to update");
    err.status = 400;
    throw err;
  }

  updates.push("updated_at = datetime('now')");
  params.push(id);

  run(`UPDATE financial_records SET ${updates.join(", ")} WHERE id = ?`, params);
  return getRecordById(id);
}

/**
 * Soft-delete a record (sets deleted = 1).
 */
function deleteRecord(id) {
  const existing = get(
    "SELECT id FROM financial_records WHERE id = ? AND deleted = 0",
    [id]
  );
  if (!existing) {
    const err = new Error("Record not found");
    err.status = 404;
    throw err;
  }
  run(
    "UPDATE financial_records SET deleted = 1, updated_at = datetime('now') WHERE id = ?",
    [id]
  );
  return { id, message: "Record soft-deleted successfully" };
}

module.exports = { createRecord, getRecordById, listRecords, updateRecord, deleteRecord };
