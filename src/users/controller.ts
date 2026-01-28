import { Response, NextFunction } from "express";
import { AuthenticatedRequest, CreateUserRequest, UpdateUserRequest } from "../shared/types";
import { translate, DEFAULT_LANGUAGE } from "../shared/services/i18n";
import { PermissionCode } from "../permissions/types";
import { hasPermission, getUserPermissions } from "../permissions/service";
import { sendWelcomeEmail } from "../shared/services/email";
import { userRepository } from "./repository";
import { permissionRepository } from "../permissions/repository";
import { CreateUserData, UpdateUserData } from "./entity";

const userController = {
  async getAllUsers(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = userRepository.findAll();
      res.status(200).json(users.map((user) => user.toJSON()));
    } catch (error) {
      next(error);
    }
  },

  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const user = userRepository.findById(id);

      if (!user) {
        const language = req.language || req.userLanguage || DEFAULT_LANGUAGE;
        const t = (key: string) => translate(language, key);
        
        res.status(404).json({ 
          error: t("errors.user_not_found")
        });
        return;
      }

      const userPermissions = getUserPermissions(user.id);
      const userWithPermissions = {
        ...user.toJSON(),
        permissions: userPermissions
      };
      
      res.status(200).json(userWithPermissions);
    } catch (error) {
      next(error);
    }
  },

  async createUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userData = req.body as CreateUserRequest;

      if (!req.userId || !hasPermission(req.userId, PermissionCode.USER_CREATE)) {
        const language = req.language || req.userLanguage || DEFAULT_LANGUAGE;
        const t = (key: string) => translate(language, key);
        
        res.status(403).json({
          error: t("errors.access_denied"),
          message: translate(language, "permissions.insufficient_permissions").replace("{permission}", PermissionCode.USER_CREATE)
        });
        return;
      }

      const createData: CreateUserData = {
        email: userData.email,
        name: userData.name,
        type: userData.type,
        password: userData.password,
        language: userData.language || DEFAULT_LANGUAGE,
        permissions: userData.permissions
      };

      const newUser = userRepository.create(createData);

      const language = newUser.language || req.language || DEFAULT_LANGUAGE;
      const t = (key: string) => translate(language, key);

      try {
        await sendWelcomeEmail(newUser.toJSON() as any);
      } catch (error) {
      }

      res.status(201).json({
        message: t("success.user_created"),
        user: newUser.toJSON()
      });
    } catch (error) {
      next(error);
    }
  },

  async updateUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      const userData = req.body as UpdateUserRequest;

      const updateData: UpdateUserData = {
        email: userData.email,
        name: userData.name,
        type: userData.type,
        password: userData.password,
        language: userData.language,
        permissions: userData.permissions
      };

      const updatedUser = userRepository.update(id, updateData);

      const language = updatedUser.language || req.language || DEFAULT_LANGUAGE;
      const t = (key: string) => translate(language, key);

      res.status(200).json({
        message: t("success.user_updated"),
        user: updatedUser.toJSON()
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteUser(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const id = parseInt(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
      userRepository.delete(id);

      const language = req.language || req.userLanguage || DEFAULT_LANGUAGE;
      const t = (key: string) => translate(language, key);

      res.status(200).json({
        message: t("success.user_deleted")
      });
    } catch (error) {
      next(error);
    }
  },

  async getAllPermissions(_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = permissionRepository.findAll();
      
      res.status(200).json(permissions);
    } catch (error) {
      next(error);
    }
  }
};

export default userController;
