import db from "../shared/database/database";
import { Statement } from "better-sqlite3";

export const permissionQueries = {
  getUserPermissions(): Statement {
    return db.prepare(`
      SELECT DISTINCT p.code as permission_code
      FROM permissions p
      WHERE p.id IN (
        SELECT DISTINCT rp.permission_id
        FROM role_permissions rp
        INNER JOIN user_roles ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = ?
        UNION
        SELECT permission_id
        FROM user_permissions
        WHERE user_id = ?
      )
    `);
  },

  getRoleByCode(): Statement {
    return db.prepare("SELECT id FROM roles WHERE code = ?");
  },

  getUserRoles(): Statement {
    return db.prepare(`
      SELECT r.code
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ?
    `);
  },

  assignRoleToUser(): Statement {
    return db.prepare(`
      INSERT OR IGNORE INTO user_roles (user_id, role_id)
      VALUES (?, ?)
    `);
  },

  removeRoleFromUser(): Statement {
    return db.prepare(`
      DELETE FROM user_roles
      WHERE user_id = ? AND role_id = ?
    `);
  },

  removeAllUserRoles(): Statement {
    return db.prepare("DELETE FROM user_roles WHERE user_id = ?");
  },

  getPermissionByCode(): Statement {
    return db.prepare("SELECT id FROM permissions WHERE code = ?");
  },

  assignPermissionToUser(): Statement {
    return db.prepare(`
      INSERT OR IGNORE INTO user_permissions (user_id, permission_id)
      VALUES (?, ?)
    `);
  },

  removePermissionFromUser(): Statement {
    return db.prepare(`
      DELETE FROM user_permissions
      WHERE user_id = ? AND permission_id = ?
    `);
  },

  removeAllUserPermissions(): Statement {
    return db.prepare("DELETE FROM user_permissions WHERE user_id = ?");
  },

  getUserDirectPermissions(): Statement {
    return db.prepare(`
      SELECT p.code as permission_code
      FROM permissions p
      INNER JOIN user_permissions up ON p.id = up.permission_id
      WHERE up.user_id = ?
    `);
  },

  getAllPermissions(): Statement {
    return db.prepare("SELECT id, code, name, description FROM permissions ORDER BY code");
  },
};
