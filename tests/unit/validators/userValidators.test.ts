import { validateUser } from "../../../src/users/validators";
import { AuthenticatedRequest } from "../../../src/shared/types";

describe("User Validators", () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      language: "en",
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("validateUser - createUser", () => {
    it("deve validar dados de criação válidos", () => {
      mockReq.body = {
        email: "test@example.com",
        name: "Test User",
        password: "password123",
        type: "user",
      };

      const middleware = validateUser("createUser");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("deve rejeitar email inválido", () => {
      mockReq.body = {
        email: "invalid-email",
        name: "Test User",
        password: "password123",
      };

      const middleware = validateUser("createUser");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve rejeitar nome muito curto", () => {
      mockReq.body = {
        email: "test@example.com",
        name: "A",
        password: "password123",
      };

      const middleware = validateUser("createUser");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve aceitar language opcional", () => {
      mockReq.body = {
        email: "test@example.com",
        name: "Test User",
        password: "password123",
        language: "pt",
      };

      const middleware = validateUser("createUser");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("validateUser - updateUser", () => {
    it("deve validar dados de atualização válidos", () => {
      mockReq.params = { id: "1" };
      mockReq.body = {
        name: "Updated Name",
      };

      const middleware = validateUser("updateUser");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("deve aceitar atualização parcial", () => {
      mockReq.params = { id: "1" };
      mockReq.body = {
        email: "newemail@example.com",
      };

      const middleware = validateUser("updateUser");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("deve rejeitar email inválido na atualização", () => {
      mockReq.params = { id: "1" };
      mockReq.body = {
        email: "invalid-email",
      };

      const middleware = validateUser("updateUser");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("deve rejeitar ID inválido", () => {
      mockReq.params = { id: "invalid" };
      mockReq.body = {
        name: "Updated Name",
      };

      const middleware = validateUser("updateUser");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe("validateUser - idParam", () => {
    it("deve validar ID válido", () => {
      mockReq.params = { id: "1" };

      const middleware = validateUser("idParam");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("deve rejeitar ID inválido", () => {
      mockReq.params = { id: "invalid" };

      const middleware = validateUser("idParam");
      middleware(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
