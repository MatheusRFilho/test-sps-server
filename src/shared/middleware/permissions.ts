import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { PermissionCode } from "../../permissions/types";
import { hasPermission, hasAllPermissions, hasAnyPermission } from "../../permissions/service";
import { translate as translateFn, DEFAULT_LANGUAGE } from "../services/i18n";

export function requirePermission(permissionCode: PermissionCode | string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.userId) {
      const language = req.language || DEFAULT_LANGUAGE;
      const t = (key: string) => translateFn(language, key);
      
      res.status(401).json({
        error: t("errors.not_authenticated"),
        message: t("guards.requires_authentication")
      });
      return;
    }

    if (!hasPermission(req.userId, permissionCode)) {
      const language = req.language || req.userLanguage || DEFAULT_LANGUAGE;
      const t = (key: string) => translateFn(language, key);
      
      res.status(403).json({
        error: t("errors.access_denied"),
        message: translateFn(language, "permissions.insufficient_permissions").replace("{permission}", permissionCode)
      });
      return;
    }

    next();
  };
}

export function requireAllPermissions(permissionCodes: (PermissionCode | string)[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.userId) {
      const language = req.language || DEFAULT_LANGUAGE;
      const t = (key: string) => translateFn(language, key);
      
      res.status(401).json({
        error: t("errors.not_authenticated"),
        message: t("guards.requires_authentication")
      });
      return;
    }

    if (!hasAllPermissions(req.userId, permissionCodes)) {
      const language = req.language || req.userLanguage || DEFAULT_LANGUAGE;
      const t = (key: string) => translateFn(language, key);
      
      res.status(403).json({
        error: t("errors.access_denied"),
        message: translateFn(language, "permissions.insufficient_permissions").replace("{permission}", permissionCodes.join(", "))
      });
      return;
    }

    next();
  };
}

export function requireAnyPermission(permissionCodes: (PermissionCode | string)[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.userId) {
      const language = req.language || DEFAULT_LANGUAGE;
      const t = (key: string) => translateFn(language, key);
      
      res.status(401).json({
        error: t("errors.not_authenticated"),
        message: t("guards.requires_authentication")
      });
      return;
    }

    if (!hasAnyPermission(req.userId, permissionCodes)) {
      const language = req.language || req.userLanguage || DEFAULT_LANGUAGE;
      const t = (key: string) => translateFn(language, key);
      
      res.status(403).json({
        error: t("errors.access_denied"),
        message: translateFn(language, "permissions.insufficient_permissions").replace("{permission}", permissionCodes.join(" ou "))
      });
      return;
    }

    next();
  };
}
