import db from "../shared/database/database";
import { Statement } from "better-sqlite3";

export const userQueries = {
  getAllUsers(): Statement {
    return db.prepare("SELECT id, name, email, type, language, theme FROM users");
  },

  getUsersPaginated(search?: string, sortBy: string = 'id', sortOrder: 'asc' | 'desc' = 'asc'): Statement {
    let query = "SELECT id, name, email, type, language, theme FROM users";
    
    if (search) {
      query += " WHERE name LIKE ? OR email LIKE ?";
    }
    
    const allowedSortFields = ['id', 'name', 'email', 'type', 'language', 'theme'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'id';
    const validSortOrder = sortOrder === 'desc' ? 'DESC' : 'ASC';
    
    query += ` ORDER BY ${validSortBy} ${validSortOrder} LIMIT ? OFFSET ?`;
    
    return db.prepare(query);
  },

  getUsersCount(search?: string): Statement {
    let query = "SELECT COUNT(*) as count FROM users";
    
    if (search) {
      query += " WHERE name LIKE ? OR email LIKE ?";
    }
    
    return db.prepare(query);
  },

  getUserById(): Statement {
    return db.prepare("SELECT id, name, email, type, language, theme, reset_token, reset_token_expires FROM users WHERE id = ?");
  },

  getUserByEmail(): Statement {
    return db.prepare("SELECT id, name, email, type, password, language, theme, reset_token, reset_token_expires FROM users WHERE email = ?");
  },

  getUserByResetToken(): Statement {
    return db.prepare("SELECT id, name, email, type, password, language, theme, reset_token, reset_token_expires FROM users WHERE reset_token = ? AND reset_token_expires > datetime('now')");
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
      INSERT INTO users (email, name, type, password, language, theme)
      VALUES (?, ?, ?, ?, ?, ?)
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
