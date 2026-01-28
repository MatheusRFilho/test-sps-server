import { userRepository } from "../../../src/users/repository";
import { getUserPermissions } from "../../../src/permissions/service";
import { comparePasswordSync, hashPasswordSync } from "../../../src/shared/utils/password";
import { sendPasswordResetEmail } from "../../../src/shared/services/email";
import { AuthenticatedRequest } from "../../../src/shared/types";

jest.mock("../../../src/users/repository");
jest.mock("../../../src/permissions/service");
jest.mock("../../../src/shared/utils/password");
jest.mock("../../../src/shared/services/email");
import jwt from "jsonwebtoken";

jest.mock("jsonwebtoken");
const mockJwt = jwt as jest.Mocked<typeof jwt>;

import authController from "../../../src/auth/controller";

describe("AuthController", () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {},
      language: "en",
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    
    mockJwt.sign = jest.fn().mockReturnValue("mock-token");
    
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("deve fazer login com credenciais válidas", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        type: "user" as const,
        language: "en" as const,
        password: "hashed-password",
        toJSON: jest.fn(() => ({
          id: 1,
          email: "test@example.com",
          name: "Test User",
          type: "user",
          language: "en",
        })),
      };

      (userRepository.findByEmail as jest.Mock).mockReturnValue(mockUser);
      (comparePasswordSync as jest.Mock).mockReturnValue(true);
      (getUserPermissions as jest.Mock).mockReturnValue(["user:read"]);

      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      await authController.login(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          token: "mock-token",
          user: expect.objectContaining({
            email: "test@example.com",
            permissions: ["user:read"],
          }),
        })
      );
    });

    it("deve retornar erro 401 com credenciais inválidas", async () => {
      (userRepository.findByEmail as jest.Mock).mockReturnValue(null);

      mockReq.body = {
        email: "test@example.com",
        password: "wrong",
      };

      await authController.login(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it("deve retornar erro 401 com senha incorreta", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: "hashed-password",
        language: "en" as const,
      };

      (userRepository.findByEmail as jest.Mock).mockReturnValue(mockUser);
      (comparePasswordSync as jest.Mock).mockReturnValue(false);

      mockReq.body = {
        email: "test@example.com",
        password: "wrong-password",
      };

      await authController.login(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it("deve retornar erro 401 quando usuário não tem senha", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        password: null,
        language: "en" as const,
      };

      (userRepository.findByEmail as jest.Mock).mockReturnValue(mockUser);

      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      await authController.login(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(comparePasswordSync).not.toHaveBeenCalled();
    });

    it("deve usar idioma do usuário na resposta", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        type: "user" as const,
        language: "pt" as const,
        password: "hashed-password",
        toJSON: jest.fn(() => ({
          id: 1,
          email: "test@example.com",
          name: "Test User",
          type: "user",
          language: "pt",
        })),
      };

      (userRepository.findByEmail as jest.Mock).mockReturnValue(mockUser);
      (comparePasswordSync as jest.Mock).mockReturnValue(true);
      (getUserPermissions as jest.Mock).mockReturnValue(["user:read"]);

      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      await authController.login(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            language: "pt",
          }),
        })
      );
    });

    it("deve usar idioma padrão quando usuário não tem idioma", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        type: "user" as const,
        language: null,
        password: "hashed-password",
        toJSON: jest.fn(() => ({
          id: 1,
          email: "test@example.com",
          name: "Test User",
          type: "user",
        })),
      };

      (userRepository.findByEmail as jest.Mock).mockReturnValue(mockUser);
      (comparePasswordSync as jest.Mock).mockReturnValue(true);
      (getUserPermissions as jest.Mock).mockReturnValue([]);

      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      await authController.login(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("deve incluir permissões do usuário na resposta", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        type: "admin" as const,
        language: "en" as const,
        password: "hashed-password",
        toJSON: jest.fn(() => ({
          id: 1,
          email: "test@example.com",
          name: "Test User",
          type: "admin",
        })),
      };

      (userRepository.findByEmail as jest.Mock).mockReturnValue(mockUser);
      (comparePasswordSync as jest.Mock).mockReturnValue(true);
      (getUserPermissions as jest.Mock).mockReturnValue(["user:create", "user:read", "user:update"]);

      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      await authController.login(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(getUserPermissions).toHaveBeenCalledWith(1);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          user: expect.objectContaining({
            permissions: ["user:create", "user:read", "user:update"],
          }),
        })
      );
    });

    it("deve chamar next em caso de erro", async () => {
      const error = new Error("Database error");
      (userRepository.findByEmail as jest.Mock).mockImplementation(() => {
        throw error;
      });

      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      await authController.login(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("requestPasswordReset", () => {
    it("deve enviar email de reset para usuário existente", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        language: "en" as const,
      };

      (userRepository.findByEmail as jest.Mock).mockReturnValue(mockUser);
      (userRepository.setResetToken as jest.Mock).mockReturnValue(undefined);
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      mockReq.body = {
        email: "test@example.com",
      };

      await authController.requestPasswordReset(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(userRepository.setResetToken).toHaveBeenCalled();
      expect(sendPasswordResetEmail).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("deve retornar sucesso mesmo se usuário não existir (segurança)", async () => {
      (userRepository.findByEmail as jest.Mock).mockReturnValue(null);

      mockReq.body = {
        email: "nonexistent@example.com",
      };

      await authController.requestPasswordReset(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(userRepository.setResetToken).not.toHaveBeenCalled();
      expect(sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("deve usar idioma do usuário no email", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        language: "pt" as const,
      };

      (userRepository.findByEmail as jest.Mock).mockReturnValue(mockUser);
      (userRepository.setResetToken as jest.Mock).mockReturnValue(undefined);
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      mockReq.body = {
        email: "test@example.com",
      };

      await authController.requestPasswordReset(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          language: "pt",
        }),
        expect.any(String)
      );
    });

    it("deve usar idioma padrão quando usuário não tem idioma", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        language: null,
      };

      (userRepository.findByEmail as jest.Mock).mockReturnValue(mockUser);
      (userRepository.setResetToken as jest.Mock).mockReturnValue(undefined);
      (sendPasswordResetEmail as jest.Mock).mockResolvedValue(undefined);

      mockReq.body = {
        email: "test@example.com",
      };
      mockReq.language = "es";

      await authController.requestPasswordReset(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          language: "es",
        }),
        expect.any(String)
      );
    });

    it("deve continuar mesmo se envio de email falhar", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        language: "en" as const,
      };

      (userRepository.findByEmail as jest.Mock).mockReturnValue(mockUser);
      (userRepository.setResetToken as jest.Mock).mockReturnValue(undefined);
      (sendPasswordResetEmail as jest.Mock).mockRejectedValue(new Error("Email failed"));

      mockReq.body = {
        email: "test@example.com",
      };

      await authController.requestPasswordReset(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("deve chamar next em caso de erro", async () => {
      const error = new Error("Database error");
      (userRepository.findByEmail as jest.Mock).mockImplementation(() => {
        throw error;
      });

      mockReq.body = {
        email: "test@example.com",
      };

      await authController.requestPasswordReset(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("resetPassword", () => {
    it("deve limpar token após reset bem-sucedido", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
      };

      (userRepository.findByResetToken as jest.Mock).mockReturnValue(mockUser);
      (hashPasswordSync as jest.Mock).mockReturnValue("new-hashed-password");
      (userRepository.update as jest.Mock).mockReturnValue(mockUser);
      (userRepository.clearResetToken as jest.Mock).mockReturnValue(undefined);

      mockReq.body = {
        token: "valid-token",
        password: "newpassword123",
      };

      await authController.resetPassword(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(userRepository.clearResetToken).toHaveBeenCalledWith(1);
    });

    it("deve chamar next em caso de erro", async () => {
      const error = new Error("Database error");
      (userRepository.findByResetToken as jest.Mock).mockImplementation(() => {
        throw error;
      });

      mockReq.body = {
        token: "valid-token",
        password: "newpassword123",
      };

      await authController.resetPassword(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
