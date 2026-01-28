import jwt from "jsonwebtoken";
import { Response, NextFunction } from "express";
import { AuthenticatedRequest, JWTPayload } from "../types";
import { translate, DEFAULT_LANGUAGE } from "../services/i18n";
import { getUserPermissions } from "../../permissions/service";

const JWT_SECRET = process.env.JWT_SECRET || "sua-chave-secreta-super-segura";

export const authMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
  try {
    const language = req.language || req.query.lang as string || req.headers["accept-language"]?.split(",")[0]?.split("-")[0] || DEFAULT_LANGUAGE;
    const t = (key: string) => translate(language, key);

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({ 
        error: t("errors.token_not_provided")
      });
      return;
    }

    const parts = authHeader.split(" ");

    if (parts.length !== 2) {
      res.status(401).json({ 
        error: t("errors.invalid_token_format")
      });
      return;
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      res.status(401).json({ 
        error: t("errors.invalid_token_format")
      });
      return;
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        res.status(401).json({ 
          error: t("errors.invalid_or_expired_token")
        });
        return;
      }

      const payload = decoded as JWTPayload;

      req.userId = payload.userId;
      req.userEmail = payload.email;
      req.userType = payload.type;
      req.userLanguage = payload.language || DEFAULT_LANGUAGE;
      
      req.permissions = getUserPermissions(payload.userId);

      return next();
    });
  } catch (error: any) {
    const language = req.language || DEFAULT_LANGUAGE;
    const t = (key: string) => translate(language, key);
    
    res.status(500).json({ 
      error: t("errors.internal_server_error"),
      message: process.env.NODE_ENV === "development" ? error.message : undefined
    });
    return;
  }
};

export { JWT_SECRET };
