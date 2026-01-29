import { Database as DatabaseType } from "better-sqlite3";

export const up = (db: DatabaseType): void => {
  db.exec(`
    ALTER TABLE users 
    ADD COLUMN theme TEXT NOT NULL DEFAULT 'light'
  `);
};

export const down = (db: DatabaseType): void => {
  db.exec(`
    CREATE TABLE users_backup AS 
    SELECT id, name, email, type, password, language, reset_token, reset_token_expires 
    FROM users
  `);
  
  db.exec("DROP TABLE users");
  
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL DEFAULT 'user',
      password TEXT NOT NULL,
      language TEXT NOT NULL DEFAULT 'en',
      reset_token TEXT,
      reset_token_expires TEXT
    )
  `);
  
  db.exec(`
    INSERT INTO users (id, name, email, type, password, language, reset_token, reset_token_expires)
    SELECT id, name, email, type, password, language, reset_token, reset_token_expires
    FROM users_backup
  `);
  
  db.exec("DROP TABLE users_backup");
};