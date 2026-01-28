import { Database as DatabaseType } from "better-sqlite3";
import bcrypt from "bcrypt";

export const up = (db: DatabaseType): void => {
  const adminExists = db.prepare("SELECT COUNT(*) as count FROM users WHERE email = ?").get("admin@spsgroup.com.br") as { count: number };
  
  if (adminExists.count === 0) {
    const insertAdmin = db.prepare(`
      INSERT INTO users (name, email, type, password, language)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    const hashedPassword = bcrypt.hashSync("1234", 10);
    const result = insertAdmin.run("admin", "admin@spsgroup.com.br", "admin", hashedPassword, "en");
    const adminId = Number(result.lastInsertRowid);

    const adminRole = db.prepare("SELECT id FROM roles WHERE code = 'admin'").get() as { id: number } | undefined;
    if (adminRole) {
      const insertUserRole = db.prepare(`
        INSERT OR IGNORE INTO user_roles (user_id, role_id)
        VALUES (?, ?)
      `);
      insertUserRole.run(adminId, adminRole.id);
    }

  }
};

export const down = (db: DatabaseType): void => {
  const deleteAdmin = db.prepare("DELETE FROM users WHERE email = ?");
  deleteAdmin.run("admin@spsgroup.com.br");
};
