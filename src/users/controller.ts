import { Response, NextFunction } from "express";
import { AuthenticatedRequest, CreateUserRequest, UpdateUserRequest, UserPreferencesRequest, PaginationQuery } from "../shared/types";
import { translate, DEFAULT_LANGUAGE } from "../shared/services/i18n";
import { PermissionCode } from "../permissions/types";
import { hasPermission, getUserPermissions } from "../permissions/service";
import { sendWelcomeEmail } from "../shared/services/email";
import { userRepository } from "./repository";
import { permissionRepository } from "../permissions/repository";
import { CreateUserData, UpdateUserData } from "./entity";
import { parsePaginationQuery, createPaginatedResponse, validateSortField } from "../shared/utils/pagination";

const userController = {
  async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = req.query as PaginationQuery;
      
      if (!query.page && !query.limit && !query.search) {
        const users = userRepository.findAll();
        res.status(200).json(users.map((user) => user.toJSON()));
        return;
      }

      const params = parsePaginationQuery(query);
      
      const allowedSortFields = ['id', 'name', 'email', 'type', 'language', 'theme'];
      params.sortBy = validateSortField(params.sortBy!, allowedSortFields);

      const { users, total } = userRepository.findPaginated(params);
      
      const response = createPaginatedResponse(
        users.map((user) => user.toJSON()),
        total,
        params
      );

      res.status(200).json(response);
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
        theme: userData.theme || "light",
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
        theme: userData.theme,
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

  async getAllPermissions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const permissions = permissionRepository.findAll();
      const language = req.language || req.userLanguage || DEFAULT_LANGUAGE;
      
      const translatedPermissions = permissions.map(permission => {
        const translationKey = `permissions.${permission.code}`;
        const nameKey = `${translationKey}.name`;
        const descriptionKey = `${translationKey}.description`;
        
        return {
          id: permission.id,
          code: permission.code,
          name: translate(language, nameKey) !== nameKey ? translate(language, nameKey) : permission.name,
          description: translate(language, descriptionKey) !== descriptionKey ? translate(language, descriptionKey) : permission.description
        };
      });
      
      res.status(200).json(translatedPermissions);
    } catch (error) {
      next(error);
    }
  },

  async getAllRoles(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const roles = permissionRepository.findAllRoles();
      const language = req.language || req.userLanguage || DEFAULT_LANGUAGE;
      
      const translatedRoles = roles.map(role => {
        const translationKey = `roles.${role.code}`;
        const nameKey = `${translationKey}.name`;
        const descriptionKey = `${translationKey}.description`;
        
        return {
          id: role.id,
          code: role.code,
          name: translate(language, nameKey) !== nameKey ? translate(language, nameKey) : role.name,
          description: translate(language, descriptionKey) !== descriptionKey ? translate(language, descriptionKey) : role.description
        };
      });
      
      res.status(200).json(translatedRoles);
    } catch (error) {
      next(error);
    }
  },

  async updateUserPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userId) {
        const language = req.language || req.userLanguage || DEFAULT_LANGUAGE;
        const t = (key: string) => translate(language, key);
        
        res.status(401).json({
          error: t("errors.unauthorized")
        });
        return;
      }

      const preferences = req.body as UserPreferencesRequest;
      const { language, theme } = preferences;

      if (language && !["pt", "en", "es"].includes(language)) {
        const currentLanguage = req.language || req.userLanguage || DEFAULT_LANGUAGE;
        const t = (key: string) => translate(currentLanguage, key);
        
        res.status(400).json({
          error: t("errors.invalid_data"),
          message: "Invalid language. Supported: pt, en, es"
        });
        return;
      }

      if (theme && !["light", "dark", "system"].includes(theme)) {
        const currentLanguage = req.language || req.userLanguage || DEFAULT_LANGUAGE;
        const t = (key: string) => translate(currentLanguage, key);
        
        res.status(400).json({
          error: t("errors.invalid_data"),
          message: "Invalid theme. Supported: light, dark, system"
        });
        return;
      }

      const updateData: UpdateUserData = {};
      if (language !== undefined) updateData.language = language as any;
      if (theme !== undefined) updateData.theme = theme as any;

      if (Object.keys(updateData).length === 0) {
        const currentLanguage = req.language || req.userLanguage || DEFAULT_LANGUAGE;
        const t = (key: string) => translate(currentLanguage, key);
        
        res.status(400).json({
          error: t("errors.invalid_data"),
          message: "At least one preference (language or theme) must be provided"
        });
        return;
      }

      const updatedUser = userRepository.update(req.userId, updateData);
      const userLanguage = updatedUser.language || DEFAULT_LANGUAGE;
      const t = (key: string) => translate(userLanguage, key);

      res.status(200).json({
        message: t("success.preferences_updated"),
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          language: updatedUser.language,
          theme: updatedUser.theme
        }
      });
    } catch (error) {
      next(error);
    }
  }
};

export default userController;
