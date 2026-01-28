import { Database as DatabaseType } from "better-sqlite3";

export const up = (db: DatabaseType): void => {
  const roles = [
    { code: "admin", name: "Administrator", description: "Full access to all features" },
    { code: "manager", name: "Manager", description: "Management access with limited permissions" },
    { code: "user", name: "User", description: "Basic user access" },
  ];

  const insertRole = db.prepare(`
    INSERT OR IGNORE INTO roles (code, name, description)
    VALUES (?, ?, ?)
  `);

  roles.forEach((role) => {
    insertRole.run(role.code, role.name, role.description);
  });
};

export const down = (db: DatabaseType): void => {
  const deleteRoles = db.prepare("DELETE FROM roles WHERE code = ?");
  const codes = ["admin", "manager", "user"];
  
  codes.forEach((code) => {
    deleteRoles.run(code);
  });
};
