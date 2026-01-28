import Database, { Database as DatabaseType } from "better-sqlite3";
import * as path from "path";
import * as fs from "fs";
import { runMigrations } from "./migrator";

const dbDir = path.join(__dirname);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(__dirname, "database.db");

const db: DatabaseType = new Database(dbPath);

db.pragma("foreign_keys = ON");

try {
  runMigrations(db);
} catch (error: any) {
  throw new Error("FAILED_TO_RUN_MIGRATIONS");
}

export default db;
