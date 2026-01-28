import Database, { Database as DatabaseType } from "better-sqlite3";
import * as fs from "fs";
import * as path from "path";
import { runMigrations } from "../../src/shared/database/migrator";

let testDb: DatabaseType | null = null;
const testDbPath = path.join(__dirname, "../../test.db");

export function getTestDb(): DatabaseType {
  if (!testDb) {
    const dbExists = fs.existsSync(testDbPath);
    
    testDb = new Database(testDbPath);
    testDb.pragma("foreign_keys = ON");

    if (!dbExists) {
      try {
        runMigrations(testDb);
      } catch (error: any) {
        throw error;
      }
    } else {
      const tables = testDb.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
      if (tables.length === 0) {
        try {
          runMigrations(testDb);
        } catch (error: any) {
          throw error;
        }
      }
    }
  }

  return testDb;
}

export function closeTestDb(): void {
  if (testDb) {
    try {
      testDb.close();
    } catch (error) {
    }
    testDb = null;
  }

  if (fs.existsSync(testDbPath)) {
    try {
      fs.unlinkSync(testDbPath);
    } catch (error) {
    }
  }
}

export function clearTestDb(): void {
  if (testDb) {
    try {
      const transaction = testDb.transaction(() => {
        testDb!.exec("DELETE FROM user_permissions WHERE user_id != 1");
        testDb!.exec("DELETE FROM user_roles WHERE user_id != 1");
        testDb!.exec("DELETE FROM users WHERE email != 'admin@spsgroup.com.br'");
      });
      transaction();
    } catch (error) {
    }
  }
}
