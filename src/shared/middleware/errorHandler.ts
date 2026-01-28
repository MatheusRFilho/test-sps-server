import { Response, NextFunction } from "express";
import { translate, DEFAULT_LANGUAGE } from "../services/i18n";
import { AuthenticatedRequest } from "../types";

export const errorHandler = (err: any, req: AuthenticatedRequest, res: Response, _next: NextFunction): void => {
  const language = req.language || req.userLanguage || DEFAULT_LANGUAGE;
  const t = (key: string, params?: Record<string, string>) => translate(language, key, params);


  if (err instanceof SyntaxError && (err.message.includes("JSON") || err.message.includes("Unexpected token"))) {
    res.status(400).json({
      error: t("errors.invalid_json"),
      message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
    return;
  }

  if (err.type === "entity.parse.failed" || (err.status === 400 && err.message && err.message.includes("JSON"))) {
    res.status(400).json({
      error: t("errors.invalid_json"),
      message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
    return;
  }

  if (err.message === "EMAIL_ALREADY_REGISTERED" || err.message === "Email já cadastrado") {
    res.status(409).json({
      error: t("errors.email_already_registered")
    });
    return;
  }

  if (err.message === "USER_NOT_FOUND" || err.message === "Usuário não encontrado") {
    res.status(404).json({
      error: t("errors.user_not_found")
    });
    return;
  }

  if (err.message === "CANNOT_DELETE_ADMIN" || err.message === "Não é possível deletar o usuário administrador") {
    res.status(403).json({
      error: t("errors.cannot_delete_admin")
    });
    return;
  }

  if (err.message === "INVALID_CREDENTIALS" || err.message === "Credenciais inválidas") {
    res.status(401).json({
      error: t("errors.invalid_credentials")
    });
    return;
  }

  if (err.name === "ZodError") {
    res.status(400).json({
      error: t("errors.invalid_data"),
      details: err.errors?.map((detail: any) => ({
        field: detail.path?.join(".") || "",
        message: detail.message || ""
      })) || []
    });
    return;
  }

  if (err.code && typeof err.code === "string" && err.code.startsWith("SQLITE_")) {
    if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
      res.status(409).json({
        error: t("errors.email_already_registered")
      });
      return;
    }
    
    res.status(500).json({
      error: t("errors.database_error"),
      message: process.env.NODE_ENV === "development" ? err.message : t("errors.internal_server_error")
    });
    return;
  }

  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      error: t("errors.invalid_or_expired_token")
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      error: t("errors.invalid_or_expired_token")
    });
    return;
  }

  if (err.message === "EMAIL_SEND_FAILED") {
    res.status(500).json({
      error: t("errors.email_send_failed")
    });
    return;
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || t("errors.internal_server_error");

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
};

export const notFoundHandler = (req: AuthenticatedRequest, res: Response): void => {
  const language = req.language || DEFAULT_LANGUAGE;
  const t = (key: string) => translate(language, key);

  res.status(404).json({
    error: t("errors.route_not_found"),
    path: req.url,
    method: req.method
  });
};
