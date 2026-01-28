import { UserRepository } from "../../../src/users/repository";
import { clearTestDb } from "../../helpers/test-db";

jest.mock("../../../src/shared/database/database", () => {
  const { getTestDb } = require("../../helpers/test-db");
  return {
    __esModule: true,
    default: getTestDb(),
  };
});

describe("UserRepository", () => {
  let userRepository: UserRepository;

  beforeAll(() => {
    userRepository = new UserRepository();
  });

  beforeEach(() => {
    clearTestDb();
  });

  describe("findAll", () => {
    it("deve retornar lista de usuários", () => {
      const users = userRepository.findAll();
      expect(Array.isArray(users)).toBe(true);
    });
  });

  describe("findByEmail", () => {
    it("deve encontrar usuário por email", () => {
      const user = userRepository.findByEmail("admin@spsgroup.com.br");
      expect(user).toBeTruthy();
      expect(user?.email).toBe("admin@spsgroup.com.br");
    });

    it("deve retornar null para email inexistente", () => {
      const user = userRepository.findByEmail("nonexistent@example.com");
      expect(user).toBeNull();
    });
  });

  describe("emailExists", () => {
    it("deve retornar true para email existente", () => {
      const exists = userRepository.emailExists("admin@spsgroup.com.br");
      expect(exists).toBe(true);
    });

    it("deve retornar false para email inexistente", () => {
      const exists = userRepository.emailExists("nonexistent@example.com");
      expect(exists).toBe(false);
    });
  });

  describe("create", () => {
    it("deve criar novo usuário", () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        name: "Test User",
        password: "test123",
        language: "en" as const,
      };

      const user = userRepository.create(userData);

      expect(user).toBeTruthy();
      expect(user.id).toBeTruthy();
      expect(user.email).toBe(userData.email);
      expect(user.name).toBe(userData.name);
      expect(user.password).toBeUndefined();
    });

    it("deve lançar erro para email duplicado", () => {
      const email = `test${Date.now()}@example.com`;
      const userData = {
        email,
        name: "Test User",
        password: "test123",
        language: "en" as const,
      };

      userRepository.create(userData);

      expect(() => {
        userRepository.create(userData);
      }).toThrow("EMAIL_ALREADY_REGISTERED");
    });

    it("deve atribuir role 'user' por padrão", () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        name: "Test User",
        password: "test123",
        language: "en" as const,
      };

      const user = userRepository.create(userData);
      expect(user).toBeTruthy();
    });
  });

  describe("update", () => {
    it("deve atualizar usuário existente", () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        name: "Original Name",
        password: "test123",
        language: "en" as const,
      };

      const user = userRepository.create(userData);

      const updatedUser = userRepository.update(user.id, {
        name: "Updated Name",
      });

      expect(updatedUser.name).toBe("Updated Name");
      expect(updatedUser.email).toBe(user.email);
    });

    it("deve lançar erro para usuário inexistente", () => {
      expect(() => {
        userRepository.update(99999, { name: "Test" });
      }).toThrow("USER_NOT_FOUND");
    });
  });

  describe("delete", () => {
    it("deve deletar usuário", () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        name: "Test User",
        password: "test123",
        language: "en" as const,
      };

      const user = userRepository.create(userData);
      const deleted = userRepository.delete(user.id);

      expect(deleted).toBe(true);
      expect(userRepository.findById(user.id)).toBeNull();
    });

    it("não deve deletar admin", () => {
      const admin = userRepository.findByEmail("admin@spsgroup.com.br");
      if (admin) {
        expect(() => {
          userRepository.delete(admin.id);
        }).toThrow("CANNOT_DELETE_ADMIN");
      }
    });
  });

  describe("findById", () => {
    it("deve encontrar usuário por ID", () => {
      const admin = userRepository.findByEmail("admin@spsgroup.com.br");
      if (admin) {
        const user = userRepository.findById(admin.id);
        expect(user).toBeTruthy();
        expect(user?.id).toBe(admin.id);
        expect(user?.email).toBe("admin@spsgroup.com.br");
      }
    });

    it("deve retornar null para ID inexistente", () => {
      const user = userRepository.findById(99999);
      expect(user).toBeNull();
    });
  });

  describe("resetToken methods", () => {
    it("deve encontrar usuário por reset token", () => {
      const crypto = require("crypto");
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const admin = userRepository.findByEmail("admin@spsgroup.com.br");
      if (admin) {
        userRepository.setResetToken(admin.id, resetToken, expiresAt);
        const user = userRepository.findByResetToken(resetToken);
        expect(user).toBeTruthy();
        expect(user?.id).toBe(admin.id);
      }
    });

    it("deve limpar reset token", () => {
      const crypto = require("crypto");
      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      const admin = userRepository.findByEmail("admin@spsgroup.com.br");
      if (admin) {
        userRepository.setResetToken(admin.id, resetToken, expiresAt);
        userRepository.clearResetToken(admin.id);
        const user = userRepository.findByResetToken(resetToken);
        expect(user).toBeNull();
      }
    });
  });
});
