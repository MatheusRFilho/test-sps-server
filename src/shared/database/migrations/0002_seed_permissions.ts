import { Database as DatabaseType } from "better-sqlite3";

export const up = (db: DatabaseType): void => {
  const permissions = [
    { code: "user:create", name: "Create User", description: "Permission to create new users" },
    { code: "user:read", name: "Read User", description: "Permission to read user information" },
    { code: "user:update", name: "Update User", description: "Permission to update user information" },
    { code: "user:delete", name: "Delete User", description: "Permission to delete users" },
    { code: "user:list", name: "List Users", description: "Permission to list all users" },
    { code: "email:block_duplicate", name: "Block Duplicate Email", description: "Permission to block duplicate email registration" },
    { code: "admin:access", name: "Admin Access", description: "Full administrative access" },
  ];

  const insertPermission = db.prepare(`
    INSERT OR IGNORE INTO permissions (code, name, description)
    VALUES (?, ?, ?)
  `);

  permissions.forEach((perm) => {
    insertPermission.run(perm.code, perm.name, perm.description);
  });
};

export const down = (db: DatabaseType): void => {
  const deletePermissions = db.prepare("DELETE FROM permissions WHERE code = ?");
  const codes = [
    "user:create",
    "user:read",
    "user:update",
    "user:delete",
    "user:list",
    "email:block_duplicate",
    "admin:access",
  ];
  
  codes.forEach((code) => {
    deletePermissions.run(code);
  });
};
