import { Response, NextFunction } from "express";
import { errorHandler, notFoundHandler } from "../../../src/shared/middleware/errorHandler";
import { AuthenticatedRequest } from "../../../src/shared/types";
import { translate } from "../../../src/shared/services/i18n";
import { ZodError } from "zod";

jest.mock("../../../src/shared/services/i18n");

describe("Error Handler Middleware", () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      language: "en",
      url: "/test",
      method: "GET",
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();

    (translate as jest.Mock).mockImplementation((_lang: string, key: string) => {
      const translations: Record<string, string> = {
        "errors.invalid_json": "Invalid JSON",
        "errors.email_already_registered": "Email already registered",
        "errors.user_not_found": "User not found",
        "errors.cannot_delete_admin": "Cannot delete admin",
        "errors.invalid_credentials": "Invalid credentials",
        "errors.invalid_data": "Invalid data",
        "errors.database_error": "Database error",
        "errors.internal_server_error": "Internal server error",
        "errors.invalid_or_expired_token": "Invalid or expired token",
        "errors.email_send_failed": "Email send failed",
        "errors.route_not_found": "Route not found",
      };
      return translations[key] || key;
    });
  });

  describe("errorHandler", () => {
    it("deve tratar erro de JSON inválido (SyntaxError)", () => {
      const error = new SyntaxError("Unexpected token in JSON");
      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid JSON",
        })
      );
    });

    it("deve tratar erro de JSON inválido (entity.parse.failed)", () => {
      const error: any = {
        type: "entity.parse.failed",
        message: "Invalid JSON",
      };
      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid JSON",
        })
      );
    });

    it("deve tratar erro EMAIL_ALREADY_REGISTERED", () => {
      const error = new Error("EMAIL_ALREADY_REGISTERED");
      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Email already registered",
        })
      );
    });

    it("deve tratar erro USER_NOT_FOUND", () => {
      const error = new Error("USER_NOT_FOUND");
      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "User not found",
        })
      );
    });

    it("deve tratar erro CANNOT_DELETE_ADMIN", () => {
      const error = new Error("CANNOT_DELETE_ADMIN");
      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Cannot delete admin",
        })
      );
    });

    it("deve tratar erro INVALID_CREDENTIALS", () => {
      const error = new Error("INVALID_CREDENTIALS");
      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid credentials",
        })
      );
    });

    it("deve tratar ZodError", () => {
      const zodError = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["email"],
          message: "Expected string",
        },
      ]);
      errorHandler(zodError, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid data",
          details: expect.arrayContaining([
            expect.objectContaining({
              field: "email",
            }),
          ]),
        })
      );
    });

    it("deve tratar erro SQLITE_CONSTRAINT_UNIQUE", () => {
      const error: any = {
        code: "SQLITE_CONSTRAINT_UNIQUE",
        message: "UNIQUE constraint failed",
      };
      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Email already registered",
        })
      );
    });

    it("deve tratar erro SQLite genérico", () => {
      const error: any = {
        code: "SQLITE_ERROR",
        message: "Database error",
      };
      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Database error",
        })
      );
    });

    it("deve tratar JsonWebTokenError", () => {
      const error: any = {
        name: "JsonWebTokenError",
        message: "Invalid token",
      };
      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid or expired token",
        })
      );
    });

    it("deve tratar TokenExpiredError", () => {
      const error: any = {
        name: "TokenExpiredError",
        message: "Token expired",
      };
      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Invalid or expired token",
        })
      );
    });

    it("deve tratar erro EMAIL_SEND_FAILED", () => {
      const error = new Error("EMAIL_SEND_FAILED");
      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Email send failed",
        })
      );
    });

    it("deve tratar erro genérico com statusCode", () => {
      const error: any = {
        statusCode: 422,
        message: "Custom error",
      };
      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(422);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Custom error",
        })
      );
    });

    it("deve incluir stack em modo desenvolvimento", () => {
      process.env.NODE_ENV = "development";
      const error = new Error("Test error");
      error.stack = "Error stack trace";

      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: "Error stack trace",
        })
      );

      delete process.env.NODE_ENV;
    });

    it("deve usar idioma da requisição", () => {
      mockReq.language = "pt";
      const error = new Error("USER_NOT_FOUND");

      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(translate).toHaveBeenCalledWith("pt", expect.any(String), undefined);
    });

    it("deve usar idioma padrão quando não fornecido", () => {
      delete mockReq.language;
      const error = new Error("USER_NOT_FOUND");

      errorHandler(error, mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(translate).toHaveBeenCalled();
    });
  });

  describe("notFoundHandler", () => {
    it("deve retornar 404 com mensagem de rota não encontrada", () => {
      mockReq.url = "/nonexistent";
      mockReq.method = "GET";

      notFoundHandler(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Route not found",
          path: "/nonexistent",
          method: "GET",
        })
      );
    });

    it("deve usar idioma da requisição", () => {
      mockReq.language = "es";
      mockReq.url = "/test";

      notFoundHandler(mockReq as AuthenticatedRequest, mockRes as Response);

      expect(translate).toHaveBeenCalledWith("es", expect.any(String));
    });
  });
});
