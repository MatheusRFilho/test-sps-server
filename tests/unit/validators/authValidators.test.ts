import { validateAuth } from "../../../src/auth/validators";
import { AuthenticatedRequest } from "../../../src/shared/types";

describe("Auth Validators", () => {
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
    jest.clearAllMocks();
  });

  describe("validateAuth - login", () => {
    it("deve validar dados de login válidos", () => {
      mockReq.body = {
        email: "test@example.com",
        password: "password123",
      };

      const middleware = validateAuth("login");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.body.email).toBe("test@example.com");
    });

    it("deve rejeitar email inválido", () => {
      mockReq.body = {
        email: "invalid-email",
        password: "password123",
      };

      const middleware = validateAuth("login");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve rejeitar dados faltando", () => {
      mockReq.body = {
        email: "test@example.com",
      };

      const middleware = validateAuth("login");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("validateAuth - requestPasswordReset", () => {
    it("deve validar email válido", () => {
      mockReq.body = {
        email: "test@example.com",
      };

      const middleware = validateAuth("requestPasswordReset");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("deve rejeitar email inválido", () => {
      mockReq.body = {
        email: "invalid-email",
      };

      const middleware = validateAuth("requestPasswordReset");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("validateAuth - resetPassword", () => {
    it("deve validar token e senha válidos", () => {
      mockReq.body = {
        token: "valid-token-123",
        password: "newpassword123",
      };

      const middleware = validateAuth("resetPassword");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("deve rejeitar sem token", () => {
      mockReq.body = {
        password: "newpassword123",
      };

      const middleware = validateAuth("resetPassword");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve rejeitar senha muito curta", () => {
      mockReq.body = {
        token: "valid-token",
        password: "123",
      };

      const middleware = validateAuth("resetPassword");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
