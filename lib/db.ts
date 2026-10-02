import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, "cronwhats.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    time TEXT NOT NULL,
    timezone TEXT NOT NULL,
    context TEXT NOT NULL,
    enabled INTEGER NOT NULL DEFAULT 1,
    last_run_key TEXT,
    last_status TEXT,
    last_message TEXT,
    last_error TEXT,
    last_run_at TEXT,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`);

export type Schedule = {
  id: number;
  name: string;
  phone: string;
  time: string;
  timezone: string;
  context: string;
  enabled: number;
  last_run_key: string | null;
  last_status: string | null;
  last_message: string | null;
  last_error: string | null;
  last_run_at: string | null;
  created_at: string;
  updated_at: string;
};

export default db;
