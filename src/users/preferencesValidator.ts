import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../shared/types";
import { translate, DEFAULT_LANGUAGE } from "../shared/services/i18n";

export const validateUserPreferences = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const { language, theme } = req.body;
    const currentLanguage = req.language || req.userLanguage || DEFAULT_LANGUAGE;
    const t = (key: string) => translate(currentLanguage, key);

    const errors: string[] = [];

    if (language === undefined && theme === undefined) {
      errors.push("At least one preference (language or theme) must be provided");
    }

    if (language !== undefined) {
      if (typeof language !== "string") {
        errors.push("Language must be a string");
      } else if (!["pt", "en", "es"].includes(language)) {
        errors.push("Invalid language. Supported: pt, en, es");
      }
    }

    if (theme !== undefined) {
      if (typeof theme !== "string") {
        errors.push("Theme must be a string");
      } else if (!["light", "dark", "system"].includes(theme)) {
        errors.push("Invalid theme. Supported: light, dark, system");
      }
    }

    if (errors.length > 0) {
      res.status(400).json({
        error: t("errors.invalid_data"),
        details: errors
      });
      return;
    }

    next();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const currentLanguage = req.language || req.userLanguage || DEFAULT_LANGUAGE;
    const t = (key: string) => translate(currentLanguage, key);
    
    res.status(500).json({
      error: t("errors.internal_server_error"),
      message: errorMessage
    });
  }
};