import { z } from "zod";
import { Response, NextFunction } from "express";
import { translate } from "../shared/services/i18n";
import { AuthenticatedRequest, SupportedLanguage } from "../shared/types";

function createUserSchemas(language: SupportedLanguage) {
  const t = (key: string) => translate(language, key);
  const supportedLanguageEnum = z.enum(["pt", "en", "es"]);

  return {
    createUser: z.object({
      email: z.string({
        required_error: t("validation.email_required"),
      }).email({
        message: t("validation.email_invalid"),
      }),
      name: z.string({
        required_error: t("validation.name_required"),
      }).min(2, {
        message: t("validation.name_min_length"),
      }).max(100, {
        message: t("validation.name_max_length"),
      }),
      type: z.enum(["admin", "manager", "user"], {
        errorMap: () => ({ message: t("validation.type_invalid") }),
      }).default("user"),
      password: z.string({
        required_error: t("validation.password_required"),
      }).min(4, {
        message: t("validation.password_min_length"),
      }),
      language: supportedLanguageEnum.optional(),
      permissions: z.array(z.string()).optional(),
    }),

    updateUser: z.object({
      email: z.string().email({
        message: t("validation.email_invalid"),
      }).optional(),
      name: z.string().min(2, {
        message: t("validation.name_min_length"),
      }).max(100, {
        message: t("validation.name_max_length"),
      }).optional(),
      type: z.enum(["admin", "manager", "user"], {
        errorMap: () => ({ message: t("validation.type_invalid") }),
      }).optional(),
      password: z.string().min(4, {
        message: t("validation.password_min_length"),
      }).optional(),
      language: supportedLanguageEnum.optional(),
      permissions: z.array(z.string()).optional(),
    }).refine((data) => Object.keys(data).length > 0, {
      message: t("validation.at_least_one_field"),
    }),

    idParam: z.object({
      id: z.coerce.number({
        required_error: t("validation.id_required"),
        invalid_type_error: t("validation.id_must_be_number"),
      }).int({
        message: t("validation.id_must_be_integer"),
      }).positive({
        message: t("validation.id_must_be_positive"),
      }),
    }),
  };
}

export function validateUser(schemaName: "createUser" | "updateUser" | "idParam") {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const language: SupportedLanguage = req.language || (req.query.lang as SupportedLanguage) || (req.body?.language as SupportedLanguage) || "en";
    const t = (key: string) => translate(language, key);
    const schemas = createUserSchemas(language);

    try {
      let result: z.SafeParseReturnType<unknown, unknown>;

      switch (schemaName) {
        case "createUser":
          result = schemas.createUser.safeParse(req.body);
          break;
        case "updateUser":
          result = schemas.updateUser.safeParse(req.body);
          if (result.success) {
            const idResult = schemas.idParam.safeParse({ id: req.params.id });
            if (!idResult.success) {
              res.status(400).json({
                error: t("errors.invalid_data"),
                details: idResult.error.issues.map((err: z.ZodIssue) => ({
                  field: err.path.join("."),
                  message: err.message,
                })),
              });
              return;
            }
          }
          break;
        case "idParam":
          result = schemas.idParam.safeParse({ id: req.params.id });
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

      if (schemaName !== "idParam") {
        req.body = result.data;
      }

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
