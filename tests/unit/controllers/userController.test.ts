import { userRepository } from "../../../src/users/repository";
import { permissionRepository } from "../../../src/permissions/repository";
import { hasPermission } from "../../../src/permissions/service";
import { sendWelcomeEmail } from "../../../src/shared/services/email";
import userController from "../../../src/users/controller";
import { AuthenticatedRequest } from "../../../src/shared/types";

jest.mock("../../../src/users/repository");
jest.mock("../../../src/permissions/repository");
jest.mock("../../../src/permissions/service");
jest.mock("../../../src/shared/services/email");

describe("UserController", () => {
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: any;
  let mockNext: jest.Mock;

  beforeEach(() => {
    mockReq = {
      body: {},
      params: {},
      userId: 1,
      language: "en",
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("getAllUsers", () => {
    it("deve retornar lista de usuários", async () => {
      const mockUsers = [
        {
          id: 1,
          email: "user1@example.com",
          name: "User 1",
          toJSON: jest.fn(() => ({ id: 1, email: "user1@example.com", name: "User 1" })),
        },
        {
          id: 2,
          email: "user2@example.com",
          name: "User 2",
          toJSON: jest.fn(() => ({ id: 2, email: "user2@example.com", name: "User 2" })),
        },
      ];

      (userRepository.findAll as jest.Mock).mockReturnValue(mockUsers);

      await userController.getAllUsers(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([
        { id: 1, email: "user1@example.com", name: "User 1" },
        { id: 2, email: "user2@example.com", name: "User 2" },
      ]);
    });

    it("deve retornar lista vazia quando não há usuários", async () => {
      (userRepository.findAll as jest.Mock).mockReturnValue([]);

      await userController.getAllUsers(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("deve chamar next em caso de erro", async () => {
      const error = new Error("Database error");
      (userRepository.findAll as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await userController.getAllUsers(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockRes.status).not.toHaveBeenCalled();
    });
  });

  describe("getUserById", () => {
    it("deve retornar usuário por ID", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        toJSON: jest.fn(() => ({ id: 1, email: "test@example.com", name: "Test User" })),
      };

      mockReq.params = { id: "1" };
      (userRepository.findById as jest.Mock).mockReturnValue(mockUser);

      await userController.getUserById(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(userRepository.findById).toHaveBeenCalledWith(1);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({ id: 1, email: "test@example.com", name: "Test User" });
    });

    it("deve retornar 404 para usuário inexistente", async () => {
      mockReq.params = { id: "999" };
      (userRepository.findById as jest.Mock).mockReturnValue(null);

      await userController.getUserById(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        })
      );
    });

    it("deve usar idioma da requisição ao retornar erro", async () => {
      mockReq.params = { id: "999" };
      mockReq.language = "pt";
      (userRepository.findById as jest.Mock).mockReturnValue(null);

      await userController.getUserById(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(404);
    });

    it("deve chamar next em caso de erro", async () => {
      mockReq.params = { id: "1" };
      const error = new Error("Database error");
      (userRepository.findById as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await userController.getUserById(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("createUser", () => {
    it("deve criar novo usuário com permissão", async () => {
      const mockUser = {
        id: 2,
        email: "new@example.com",
        name: "New User",
        language: "en" as const,
        toJSON: jest.fn(() => ({ id: 2, email: "new@example.com", name: "New User" })),
      };

      (hasPermission as jest.Mock).mockReturnValue(true);
      (userRepository.create as jest.Mock).mockReturnValue(mockUser);
      (sendWelcomeEmail as jest.Mock).mockResolvedValue(undefined);

      mockReq.body = {
        email: "new@example.com",
        name: "New User",
        password: "password123",
        type: "user",
      };

      await userController.createUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(userRepository.create).toHaveBeenCalled();
      expect(sendWelcomeEmail).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("deve criar usuário com permissões customizadas", async () => {
      const mockUser = {
        id: 2,
        email: "new@example.com",
        name: "New User",
        language: "en" as const,
        toJSON: jest.fn(() => ({ id: 2, email: "new@example.com", name: "New User" })),
      };

      (hasPermission as jest.Mock).mockReturnValue(true);
      (userRepository.create as jest.Mock).mockReturnValue(mockUser);
      (sendWelcomeEmail as jest.Mock).mockResolvedValue(undefined);

      mockReq.body = {
        email: "new@example.com",
        name: "New User",
        password: "password123",
        type: "user",
        permissions: ["user:read", "user:update"],
      };

      await userController.createUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          permissions: ["user:read", "user:update"],
        })
      );
    });

    it("deve usar idioma padrão quando não fornecido", async () => {
      const mockUser = {
        id: 2,
        email: "new@example.com",
        name: "New User",
        language: "en" as const,
        toJSON: jest.fn(() => ({ id: 2, email: "new@example.com", name: "New User" })),
      };

      (hasPermission as jest.Mock).mockReturnValue(true);
      (userRepository.create as jest.Mock).mockReturnValue(mockUser);
      (sendWelcomeEmail as jest.Mock).mockResolvedValue(undefined);

      mockReq.body = {
        email: "new@example.com",
        name: "New User",
        password: "password123",
        type: "user",
      };

      await userController.createUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(userRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          language: "en",
        })
      );
    });

    it("deve retornar 403 sem permissão", async () => {
      (hasPermission as jest.Mock).mockReturnValue(false);

      mockReq.body = {
        email: "new@example.com",
        name: "New User",
        password: "password123",
      };

      await userController.createUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it("deve retornar 403 quando userId não está presente", async () => {
      delete mockReq.userId;

      mockReq.body = {
        email: "new@example.com",
        name: "New User",
        password: "password123",
      };

      await userController.createUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(userRepository.create).not.toHaveBeenCalled();
    });

    it("deve continuar mesmo se envio de email falhar", async () => {
      const mockUser = {
        id: 2,
        email: "new@example.com",
        name: "New User",
        language: "en" as const,
        toJSON: jest.fn(() => ({ id: 2, email: "new@example.com", name: "New User" })),
      };

      (hasPermission as jest.Mock).mockReturnValue(true);
      (userRepository.create as jest.Mock).mockReturnValue(mockUser);
      (sendWelcomeEmail as jest.Mock).mockRejectedValue(new Error("Email failed"));

      mockReq.body = {
        email: "new@example.com",
        name: "New User",
        password: "password123",
        type: "user",
      };

      await userController.createUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(userRepository.create).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it("deve chamar next em caso de erro no repositório", async () => {
      (hasPermission as jest.Mock).mockReturnValue(true);
      const error = new Error("Database error");
      (userRepository.create as jest.Mock).mockImplementation(() => {
        throw error;
      });

      mockReq.body = {
        email: "new@example.com",
        name: "New User",
        password: "password123",
        type: "user",
      };

      await userController.createUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("updateUser", () => {
    it("deve atualizar usuário", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Updated Name",
        language: "en" as const,
        toJSON: jest.fn(() => ({ id: 1, email: "test@example.com", name: "Updated Name" })),
      };

      mockReq.params = { id: "1" };
      mockReq.body = {
        name: "Updated Name",
      };

      (userRepository.update as jest.Mock).mockReturnValue(mockUser);

      await userController.updateUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(userRepository.update).toHaveBeenCalledWith(1, expect.objectContaining({ name: "Updated Name" }));
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("deve atualizar usuário com permissões", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        language: "en" as const,
        toJSON: jest.fn(() => ({ id: 1, email: "test@example.com", name: "Test User" })),
      };

      mockReq.params = { id: "1" };
      mockReq.body = {
        permissions: ["user:read", "user:update"],
      };

      (userRepository.update as jest.Mock).mockReturnValue(mockUser);

      await userController.updateUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(userRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          permissions: ["user:read", "user:update"],
        })
      );
    });

    it("deve atualizar múltiplos campos", async () => {
      const mockUser = {
        id: 1,
        email: "newemail@example.com",
        name: "New Name",
        language: "pt" as const,
        toJSON: jest.fn(() => ({ id: 1, email: "newemail@example.com", name: "New Name" })),
      };

      mockReq.params = { id: "1" };
      mockReq.body = {
        email: "newemail@example.com",
        name: "New Name",
        language: "pt",
      };

      (userRepository.update as jest.Mock).mockReturnValue(mockUser);

      await userController.updateUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(userRepository.update).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          email: "newemail@example.com",
          name: "New Name",
          language: "pt",
        })
      );
    });

    it("deve usar idioma do usuário atualizado na resposta", async () => {
      const mockUser = {
        id: 1,
        email: "test@example.com",
        name: "Test User",
        language: "pt" as const,
        toJSON: jest.fn(() => ({ id: 1, email: "test@example.com", name: "Test User" })),
      };

      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated Name" };

      (userRepository.update as jest.Mock).mockReturnValue(mockUser);

      await userController.updateUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("deve chamar next em caso de erro", async () => {
      mockReq.params = { id: "1" };
      mockReq.body = { name: "Updated Name" };
      const error = new Error("Database error");
      (userRepository.update as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await userController.updateUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("deleteUser", () => {
    it("deve deletar usuário", async () => {
      mockReq.params = { id: "2" };
      (userRepository.delete as jest.Mock).mockReturnValue(true);

      await userController.deleteUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(userRepository.delete).toHaveBeenCalledWith(2);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it("deve usar idioma da requisição na resposta", async () => {
      mockReq.params = { id: "2" };
      mockReq.language = "pt";
      (userRepository.delete as jest.Mock).mockReturnValue(true);

      await userController.deleteUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("deve chamar next em caso de erro", async () => {
      mockReq.params = { id: "2" };
      const error = new Error("Database error");
      (userRepository.delete as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await userController.deleteUser(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe("getAllPermissions", () => {
    it("deve retornar lista de permissões", async () => {
      const mockPermissions = [
        { id: 1, code: "user:create", name: "Create User" },
        { id: 2, code: "user:read", name: "Read User" },
      ];

      (permissionRepository.findAll as jest.Mock).mockReturnValue(mockPermissions);

      await userController.getAllPermissions(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(mockPermissions);
    });

    it("deve retornar lista vazia quando não há permissões", async () => {
      (permissionRepository.findAll as jest.Mock).mockReturnValue([]);

      await userController.getAllPermissions(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith([]);
    });

    it("deve chamar next em caso de erro", async () => {
      const error = new Error("Database error");
      (permissionRepository.findAll as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await userController.getAllPermissions(mockReq as AuthenticatedRequest, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });
});
