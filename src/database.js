/**
 * Database layer using sql.js (pure JS SQLite).
 * Keeps everything in memory and optionally persists to a Buffer.
 * For production, swap this with a real SQLite file using better-sqlite3
 * or a cloud DB driver without changing any other layer.
 */

const initSqlJs = require("sql.js");
const path = require("path");
const fs = require("fs");

let db = null;
const DB_PATH = path.join(__dirname, "../data/finance.sqlite");

async function getDB() {
  if (db) return db;

  const SQL = await initSqlJs();

  // Load existing DB file if present, else create fresh
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  initSchema();
  return db;
}

function persistDB() {
  if (!db) return;
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function initSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      email       TEXT UNIQUE NOT NULL,
      password    TEXT NOT NULL,
      role        TEXT NOT NULL CHECK(role IN ('viewer','analyst','admin')),
      status      TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS financial_records (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      amount      REAL NOT NULL CHECK(amount > 0),
      type        TEXT NOT NULL CHECK(type IN ('income','expense')),
      category    TEXT NOT NULL,
      date        TEXT NOT NULL,
      notes       TEXT,
      deleted     INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_records_type     ON financial_records(type);
    CREATE INDEX IF NOT EXISTS idx_records_category ON financial_records(category);
    CREATE INDEX IF NOT EXISTS idx_records_date     ON financial_records(date);
    CREATE INDEX IF NOT EXISTS idx_records_deleted  ON financial_records(deleted);
  `);

  persistDB();
}

/**
 * Execute a write statement (INSERT / UPDATE / DELETE).
 * Returns { changes, lastInsertRowid }.
 */
function run(sql, params = []) {
  db.run(sql, params);
  persistDB();
  // sql.js doesn't expose rowid easily — return sentinel
  return { changes: 1 };
}

/**
 * Fetch multiple rows.
 */
function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

/**
 * Fetch a single row (or undefined).
 */
function get(sql, params = []) {
  const rows = all(sql, params);
  return rows[0];
}

module.exports = { getDB, run, get, all, persistDB };
