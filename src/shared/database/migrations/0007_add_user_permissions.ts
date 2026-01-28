import { Database as DatabaseType } from "better-sqlite3";

export const up = (db: DatabaseType): void => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_permissions (
      user_id INTEGER NOT NULL,
      permission_id INTEGER NOT NULL,
      PRIMARY KEY (user_id, permission_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
    )
  `);
};

export const down = (db: DatabaseType): void => {
  db.exec("DROP TABLE IF EXISTS user_permissions");
};
