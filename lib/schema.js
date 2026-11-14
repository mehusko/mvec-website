// Tables for the admin panel. Runs on every cold start with IF NOT EXISTS, so there is nothing to migrate by hand.
//
// Most business data (inquiries, workers, jobs, clients, placements, invoices ...) lives in one table, `records`,
// with the fields kept as JSON text in `data`. That keeps every module the same shape and easy to extend.
export const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS records (
    id TEXT PRIMARY KEY,
    entity TEXT NOT NULL,
    status TEXT,
    data TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    created_by TEXT,
    deleted_at TEXT,
    deleted_by TEXT
  )`,
  'CREATE INDEX IF NOT EXISTS records_entity ON records (entity, deleted_at, created_at)',
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    totp_secret TEXT,
    totp_enabled INTEGER NOT NULL DEFAULT 0,
    backup_codes TEXT,
    linked_id TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    last_login TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS roles (
    name TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    permissions TEXT NOT NULL,
    system INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    at TEXT NOT NULL,
    user_id TEXT,
    email TEXT,
    action TEXT NOT NULL,
    entity TEXT,
    entity_id TEXT,
    detail TEXT,
    ip TEXT
  )`,
  'CREATE INDEX IF NOT EXISTS audit_at ON audit_log (at)',
  `CREATE TABLE IF NOT EXISTS login_attempts (
    ip TEXT NOT NULL,
    at INTEGER NOT NULL
  )`,
  'CREATE INDEX IF NOT EXISTS login_attempts_ip ON login_attempts (ip, at)',
  `CREATE TABLE IF NOT EXISTS counters (
    name TEXT PRIMARY KEY,
    value INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  )`,
];
