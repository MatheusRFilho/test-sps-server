import { Permission, Role } from "./entities";
import { permissionQueries } from "./queries";

interface UserPermission {
  permission_code: string;
}

export class PermissionRepository {
  findAll(): Permission[] {
    const stmt = permissionQueries.getAllPermissions();
    const rows = stmt.all() as any[];
    return rows.map((row) => Permission.fromDatabase(row));
  }

  findAllRoles(): Role[] {
    const stmt = permissionQueries.getAllRoles();
    const rows = stmt.all() as any[];
    return rows.map((row) => Role.fromDatabase(row));
  }

  getUserPermissions(userId: number): string[] {
    const stmt = permissionQueries.getUserPermissions();
    const permissions = stmt.all(userId, userId) as UserPermission[];
    return permissions.map((p) => p.permission_code);
  }

  getUserRoles(userId: number): string[] {
    const stmt = permissionQueries.getUserRoles();
    const roles = stmt.all(userId) as { code: string }[];
    return roles.map((r) => r.code);
  }

  getUserDirectPermissions(userId: number): string[] {
    const stmt = permissionQueries.getUserDirectPermissions();
    const permissions = stmt.all(userId) as UserPermission[];
    return permissions.map((p) => p.permission_code);
  }

  getRoleByCode(roleCode: string): { id: number } | null {
    const stmt = permissionQueries.getRoleByCode();
    const row = stmt.get(roleCode) as { id: number } | undefined;
    if (!row) {
      return null;
    }
    return row;
  }

  getPermissionByCode(permissionCode: string): Permission | null {
    const allPermissions = this.findAll();
    return allPermissions.find((p) => p.code === permissionCode) || null;
  }

  assignRoleToUser(userId: number, roleCode: string): void {
    const role = this.getRoleByCode(roleCode);
    if (!role) {
      throw new Error(`Role '${roleCode}' not found`);
    }

    const insertUserRole = permissionQueries.assignRoleToUser();
    insertUserRole.run(userId, role.id);
  }

  removeRoleFromUser(userId: number, roleCode: string): void {
    const role = this.getRoleByCode(roleCode);
    if (!role) {
      throw new Error(`Role '${roleCode}' not found`);
    }

    const deleteUserRole = permissionQueries.removeRoleFromUser();
    deleteUserRole.run(userId, role.id);
  }

  getPermissionById(permissionId: number): Permission | null {
    const allPermissions = this.findAll();
    return allPermissions.find((p) => p.id === permissionId) || null;
  }

  assignPermissionToUser(userId: number, permissionCode: string): void {
    const permission = this.getPermissionByCode(permissionCode);
    if (!permission) {
      throw new Error(`Permission '${permissionCode}' not found`);
    }

    const insertUserPermission = permissionQueries.assignPermissionToUser();
    insertUserPermission.run(userId, permission.id);
  }

  removePermissionFromUser(userId: number, permissionCode: string): void {
    const permission = this.getPermissionByCode(permissionCode);
    if (!permission) {
      throw new Error(`Permission '${permissionCode}' not found`);
    }

    const deleteUserPermission = permissionQueries.removePermissionFromUser();
    deleteUserPermission.run(userId, permission.id);
  }

  setUserPermissions(userId: number, permissionCodes: string[]): void {
    const removeAllStmt = permissionQueries.removeAllUserPermissions();
    removeAllStmt.run(userId);

    for (const code of permissionCodes) {
      try {
        this.assignPermissionToUser(userId, code);
      } catch (error: any) {
        throw new Error(`FAILED_TO_ASSIGN_PERMISSION_${code.toUpperCase()}`);
      }
    }
  }
}

export const permissionRepository = new PermissionRepository();
