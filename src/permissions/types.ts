export interface Permission {
  id: number;
  name: string;
  code: string;
  description: string;
}

export interface Role {
  id: number;
  name: string;
  code: string;
  description: string;
  permissions?: Permission[];
}

export interface UserRole {
  userId: number;
  roleId: number;
}

export interface RolePermission {
  roleId: number;
  permissionId: number;
}

export enum PermissionCode {
  USER_CREATE = "user:create",
  USER_READ = "user:read",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",
  USER_LIST = "user:list",
  EMAIL_BLOCK_DUPLICATE = "email:block_duplicate",
  ADMIN_ACCESS = "admin:access",
}
export enum RoleCode {
  ADMIN = "admin",
  MANAGER = "manager",
  USER = "user",
}
