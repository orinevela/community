import "server-only";
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "community.db");

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  photo TEXT,
  city TEXT,
  neighborhood TEXT,
  radius_km INTEGER NOT NULL DEFAULT 5,
  about TEXT NOT NULL DEFAULT '',
  help_types TEXT NOT NULL DEFAULT '[]',
  contacts TEXT NOT NULL DEFAULT '{}',
  availability TEXT NOT NULL DEFAULT '',
  profile_completed_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS skills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL DEFAULT '',
  details TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_skills_user ON skills(user_id);

CREATE TABLE IF NOT EXISTS communities (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  invite_code TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL REFERENCES users(id),
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS memberships (
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  community_id TEXT NOT NULL REFERENCES communities(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  bio_override TEXT NOT NULL DEFAULT '',
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (user_id, community_id)
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS otp_codes (
  phone TEXT PRIMARY KEY,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0
);

-- Analytics events backing the PRD KPIs (activation, search-to-contact, MAU, retention)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  community_id TEXT,
  user_id TEXT,
  type TEXT NOT NULL,
  ref TEXT,
  meta TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_events_comm ON events(community_id, type, created_at);
`;

const globalForDb = globalThis as unknown as { __ccDb?: DatabaseSync };

export function db(): DatabaseSync {
  if (!globalForDb.__ccDb) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    const d = new DatabaseSync(DB_PATH);
    d.exec(SCHEMA);
    globalForDb.__ccDb = d;
  }
  return globalForDb.__ccDb;
}

export function now() {
  return Date.now();
}

export function tx<T>(fn: () => T): T {
  const d = db();
  d.exec("BEGIN");
  try {
    const r = fn();
    d.exec("COMMIT");
    return r;
  } catch (e) {
    d.exec("ROLLBACK");
    throw e;
  }
}
