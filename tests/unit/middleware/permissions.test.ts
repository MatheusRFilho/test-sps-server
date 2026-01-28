import { Response, NextFunction } from "express";
import { requirePermission } from "../../../src/shared/middleware/permissions";
import { PermissionCode } from "../../../src/permissions/types";
import { AuthenticatedRequest } from "../../../src/shared/types";

jest.mock("../../../src/shared/database/database", () => {
  const { getTestDb } = require("../../helpers/test-db");
  return {
    __esModule: true,
    default: getTestDb(),
  };
});

describe("Permissions Middleware", () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      userId: 1,
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("requirePermission", () => {
    it("deve permitir acesso com permissão válida", () => {
      const middleware = requirePermission(PermissionCode.USER_READ);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockRes.status).not.toHaveBeenCalled();
    });

    it("deve rejeitar acesso sem userId", () => {
      mockReq.userId = undefined;
      const middleware = requirePermission(PermissionCode.USER_CREATE);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
