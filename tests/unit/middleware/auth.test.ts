import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../../src/shared/types";

const testAuthMiddleware = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers?.authorization;
  
  if (!authHeader) {
    res.status(401).json({ error: "Token não fornecido" });
    return;
  }
  
  const token = authHeader.replace("Bearer ", "");
  
  if (token === "valid-token") {
    req.userId = 1;
    req.userEmail = "test@example.com";
    req.userType = "user";
    req.userLanguage = "en";
    next();
  } else {
    res.status(401).json({ error: "Token inválido" });
  }
};

describe("Auth Middleware", () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("authMiddleware", () => {
    it("deve autenticar token válido", () => {
      mockReq.headers = {
        authorization: "Bearer valid-token",
      };

      testAuthMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
      expect(mockReq.userId).toBe(1);
    });

    it("deve rejeitar requisição sem token", () => {
      mockReq.headers = {};

      testAuthMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve rejeitar token inválido", () => {
      mockReq.headers = {
        authorization: "Bearer invalid-token",
      };

      testAuthMiddleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
