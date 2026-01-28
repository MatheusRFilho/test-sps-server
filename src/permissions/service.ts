import { PermissionCode } from "./types";
import { permissionRepository } from "./repository";

export function getUserPermissions(userId: number): string[] {
  return permissionRepository.getUserPermissions(userId);
}

export function hasPermission(userId: number, permissionCode: PermissionCode | string): boolean {
  const permissions = getUserPermissions(userId);
  return permissions.includes(permissionCode);
}

export function hasAllPermissions(userId: number, permissionCodes: (PermissionCode | string)[]): boolean {
  const userPermissions = getUserPermissions(userId);
  return permissionCodes.every((code) => userPermissions.includes(code));
}

export function hasAnyPermission(userId: number, permissionCodes: (PermissionCode | string)[]): boolean {
  const userPermissions = getUserPermissions(userId);
  return permissionCodes.some((code) => userPermissions.includes(code));
}

export function assignRoleToUser(userId: number, roleCode: string): void {
  permissionRepository.assignRoleToUser(userId, roleCode);
}

export function removeRoleFromUser(userId: number, roleCode: string): void {
  permissionRepository.removeRoleFromUser(userId, roleCode);
}

export function getUserRoles(userId: number): string[] {
  return permissionRepository.getUserRoles(userId);
}

export function assignPermissionToUser(userId: number, permissionCode: string): void {
  permissionRepository.assignPermissionToUser(userId, permissionCode);
}

export function removePermissionFromUser(userId: number, permissionCode: string): void {
  permissionRepository.removePermissionFromUser(userId, permissionCode);
}

export function setUserPermissions(userId: number, permissionCodes: string[]): void {
  permissionRepository.setUserPermissions(userId, permissionCodes);
}

export function getUserDirectPermissions(userId: number): string[] {
  return permissionRepository.getUserDirectPermissions(userId);
}
