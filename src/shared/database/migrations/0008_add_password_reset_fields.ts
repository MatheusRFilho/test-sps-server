import { Database as DatabaseType } from "better-sqlite3";

export const up = (db: DatabaseType): void => {
  db.exec(`
    ALTER TABLE users 
    ADD COLUMN reset_token TEXT NULL
  `);
  
  db.exec(`
    ALTER TABLE users 
    ADD COLUMN reset_token_expires DATETIME NULL
  `);
  
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token)
  `);
};

export const down = (db: DatabaseType): void => {
  db.exec("DROP INDEX IF EXISTS idx_users_reset_token");
  
  db.exec(`
    CREATE TABLE users_backup AS SELECT id, name, email, type, password, language FROM users;
    DROP TABLE users;
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'user',
      password TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en'
    );
    INSERT INTO users (id, name, email, type, password, language) 
    SELECT id, name, email, type, password, language FROM users_backup;
    DROP TABLE users_backup;
  `);
};
