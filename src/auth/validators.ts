import { z } from "zod";
import { Response, NextFunction } from "express";
import { translate } from "../shared/services/i18n";
import { AuthenticatedRequest, SupportedLanguage } from "../shared/types";

function createAuthSchemas(language: SupportedLanguage) {
  const t = (key: string) => translate(language, key);

  return {
    login: z.object({
      email: z.string({
        required_error: t("validation.email_required"),
      }).email({
        message: t("validation.email_invalid"),
      }),
      password: z.string({
        required_error: t("validation.password_required"),
      }).min(1, {
        message: t("validation.password_required"),
      }),
    }),
    requestPasswordReset: z.object({
      email: z.string({
        required_error: t("validation.email_required"),
      }).email({
        message: t("validation.email_invalid"),
      }),
    }),
    resetPassword: z.object({
      token: z.string({
        required_error: t("validation.token_required"),
      }).min(1, {
        message: t("validation.token_required"),
      }),
      password: z.string({
        required_error: t("validation.password_required"),
      }).min(4, {
        message: t("validation.password_min_length"),
      }),
    }),
  };
}

export function validateAuth(schemaName: "login" | "requestPasswordReset" | "resetPassword") {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const language: SupportedLanguage = req.language || (req.query.lang as SupportedLanguage) || (req.body?.language as SupportedLanguage) || "en";
    const t = (key: string) => translate(language, key);
    const schemas = createAuthSchemas(language);

    try {
      let result: z.SafeParseReturnType<unknown, unknown>;

      switch (schemaName) {
        case "login":
          result = schemas.login.safeParse(req.body);
          break;
        case "requestPasswordReset":
          result = schemas.requestPasswordReset.safeParse(req.body);
          break;
        case "resetPassword":
          result = schemas.resetPassword.safeParse(req.body);
          break;
        default:
          next();
          return;
      }

      if (!result.success) {
        const errors = result.error.issues.map((err: z.ZodIssue) => ({
          field: err.path.join("."),
          message: err.message,
        }));

        res.status(400).json({
          error: t("errors.invalid_data"),
          details: errors,
        });
        return;
      }

      req.body = result.data;
      next();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(500).json({
        error: t("errors.internal_server_error"),
        message: process.env.NODE_ENV === "development" ? errorMessage : undefined,
      });
    }
  };
}
