import { Database as DatabaseType } from "better-sqlite3";

export const up = (db: DatabaseType): void => {
  const adminRole = db.prepare("SELECT id FROM roles WHERE code = 'admin'").get() as { id: number } | undefined;
  const allPermissions = db.prepare("SELECT id FROM permissions").all() as { id: number }[];

  if (adminRole) {
    const insertRolePermission = db.prepare(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
      VALUES (?, ?)
    `);

    allPermissions.forEach((perm) => {
      insertRolePermission.run(adminRole.id, perm.id);
    });
  }

  const managerRole = db.prepare("SELECT id FROM roles WHERE code = 'manager'").get() as { id: number } | undefined;
  if (managerRole) {
    const insertRolePermission = db.prepare(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
      VALUES (?, ?)
    `);

    const managerPermissions = [
      "user:create",
      "user:read",
      "user:update",
      "user:list",
      "email:block_duplicate",
    ];

    managerPermissions.forEach((permCode) => {
      const perm = db.prepare("SELECT id FROM permissions WHERE code = ?").get(permCode) as { id: number } | undefined;
      if (perm) {
        insertRolePermission.run(managerRole.id, perm.id);
      }
    });
  }

  const userRole = db.prepare("SELECT id FROM roles WHERE code = 'user'").get() as { id: number } | undefined;
  if (userRole) {
    const insertRolePermission = db.prepare(`
      INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
      VALUES (?, ?)
    `);

    const userPermissions = [
      "user:read",
      "user:list",
    ];

    userPermissions.forEach((permCode) => {
      const perm = db.prepare("SELECT id FROM permissions WHERE code = ?").get(permCode) as { id: number } | undefined;
      if (perm) {
        insertRolePermission.run(userRole.id, perm.id);
      }
    });
  }
};

export const down = (db: DatabaseType): void => {
  db.exec("DELETE FROM role_permissions");
};
