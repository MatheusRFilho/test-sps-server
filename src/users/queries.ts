import db from "../shared/database/database";
import { Statement } from "better-sqlite3";

export const userQueries = {
  getAllUsers(): Statement {
    return db.prepare("SELECT id, name, email, type, language FROM users");
  },

  getUserById(): Statement {
    return db.prepare("SELECT id, name, email, type, language, reset_token, reset_token_expires FROM users WHERE id = ?");
  },

  getUserByEmail(): Statement {
    return db.prepare("SELECT id, name, email, type, password, language, reset_token, reset_token_expires FROM users WHERE email = ?");
  },

  getUserByResetToken(): Statement {
    return db.prepare("SELECT id, name, email, type, password, language, reset_token, reset_token_expires FROM users WHERE reset_token = ? AND reset_token_expires > datetime('now')");
  },

  setResetToken(): Statement {
    return db.prepare("UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?");
  },

  clearResetToken(): Statement {
    return db.prepare("UPDATE users SET reset_token = NULL, reset_token_expires = NULL WHERE id = ?");
  },

  emailExists(): Statement {
    return db.prepare("SELECT COUNT(*) as count FROM users WHERE email = ?");
  },

  createUser(): Statement {
    return db.prepare(`
      INSERT INTO users (email, name, type, password, language)
      VALUES (?, ?, ?, ?, ?)
    `);
  },

  updateUser(updates: string[]): Statement {
    return db.prepare(`
      UPDATE users 
      SET ${updates.join(", ")}
      WHERE id = ?
    `);
  },

  deleteUser(): Statement {
    return db.prepare("DELETE FROM users WHERE id = ?");
  },
};
