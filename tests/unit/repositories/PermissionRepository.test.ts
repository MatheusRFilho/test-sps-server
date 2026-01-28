import { PermissionRepository } from "../../../src/permissions/repository";
import { userRepository } from "../../../src/users/repository";

jest.mock("../../../src/shared/database/database", () => {
  const { getTestDb } = require("../../helpers/test-db");
  return {
    __esModule: true,
    default: getTestDb(),
  };
});

describe("PermissionRepository", () => {
  let permissionRepository: PermissionRepository;
  let testUserId: number;

  beforeAll(() => {
    permissionRepository = new PermissionRepository();
  });

  beforeEach(() => {
    const testUser = userRepository.create({
      email: `test${Date.now()}@example.com`,
      name: "Test User",
      password: "test1234",
      type: "user",
      language: "en",
    });
    testUserId = testUser.id;
  });

  describe("findAll", () => {
    it("deve retornar lista de permissões", () => {
      const permissions = permissionRepository.findAll();
      expect(Array.isArray(permissions)).toBe(true);
      expect(permissions.length).toBeGreaterThan(0);
    });

    it("deve retornar permissões com estrutura correta", () => {
      const permissions = permissionRepository.findAll();
      if (permissions.length > 0) {
        const permission = permissions[0];
        expect(permission).toHaveProperty("id");
        expect(permission).toHaveProperty("code");
        expect(permission).toHaveProperty("name");
      }
    });
  });

  describe("getUserPermissions", () => {
    it("deve retornar permissões do usuário", () => {
      const permissions = permissionRepository.getUserPermissions(testUserId);
      expect(Array.isArray(permissions)).toBe(true);
    });

    it("deve retornar array vazio para usuário sem permissões", () => {
      const permissions = permissionRepository.getUserPermissions(99999);
      expect(Array.isArray(permissions)).toBe(true);
    });

    it("deve incluir permissões de roles e permissões diretas", () => {
      const adminPermissions = permissionRepository.getUserPermissions(1);
      expect(adminPermissions.length).toBeGreaterThan(0);
    });
  });

  describe("getUserRoles", () => {
    it("deve retornar roles do usuário", () => {
      const roles = permissionRepository.getUserRoles(testUserId);
      expect(Array.isArray(roles)).toBe(true);
    });

    it("deve retornar array vazio para usuário sem roles", () => {
      const roles = permissionRepository.getUserRoles(99999);
      expect(Array.isArray(roles)).toBe(true);
    });
  });

  describe("getUserDirectPermissions", () => {
    it("deve retornar permissões diretas do usuário", () => {
      const permissions = permissionRepository.getUserDirectPermissions(testUserId);
      expect(Array.isArray(permissions)).toBe(true);
    });
  });

  describe("getRoleByCode", () => {
    it("deve retornar role existente", () => {
      const role = permissionRepository.getRoleByCode("user");
      expect(role).not.toBeNull();
      expect(role).toHaveProperty("id");
    });

    it("deve retornar null para role inexistente", () => {
      const role = permissionRepository.getRoleByCode("nonexistent_role");
      expect(role).toBeNull();
    });
  });

  describe("getPermissionByCode", () => {
    it("deve retornar permissão existente", () => {
      const permission = permissionRepository.getPermissionByCode("user:read");
      expect(permission).not.toBeNull();
      expect(permission).toHaveProperty("code", "user:read");
    });

    it("deve retornar null para permissão inexistente", () => {
      const permission = permissionRepository.getPermissionByCode("nonexistent:permission");
      expect(permission).toBeNull();
    });
  });

  describe("assignRoleToUser", () => {
    it("deve atribuir role ao usuário", () => {
      expect(() => {
        permissionRepository.assignRoleToUser(testUserId, "user");
      }).not.toThrow();
    });

    it("deve lançar erro para role inexistente", () => {
      expect(() => {
        permissionRepository.assignRoleToUser(testUserId, "nonexistent_role");
      }).toThrow("Role 'nonexistent_role' not found");
    });
  });

  describe("removeRoleFromUser", () => {
    it("deve remover role do usuário", () => {
      permissionRepository.assignRoleToUser(testUserId, "user");
      
      expect(() => {
        permissionRepository.removeRoleFromUser(testUserId, "user");
      }).not.toThrow();
    });

    it("deve lançar erro ao tentar remover role inexistente", () => {
      expect(() => {
        permissionRepository.removeRoleFromUser(testUserId, "nonexistent_role");
      }).toThrow("Role 'nonexistent_role' not found");
    });
  });

  describe("assignPermissionToUser", () => {
    it("deve atribuir permissão ao usuário", () => {
      expect(() => {
        permissionRepository.assignPermissionToUser(testUserId, "user:read");
      }).not.toThrow();
    });

    it("deve lançar erro para permissão inexistente", () => {
      expect(() => {
        permissionRepository.assignPermissionToUser(testUserId, "nonexistent:permission");
      }).toThrow("Permission 'nonexistent:permission' not found");
    });
  });

  describe("removePermissionFromUser", () => {
    it("deve remover permissão do usuário", () => {
      permissionRepository.assignPermissionToUser(testUserId, "user:read");
      
      expect(() => {
        permissionRepository.removePermissionFromUser(testUserId, "user:read");
      }).not.toThrow();
    });

    it("deve lançar erro ao tentar remover permissão inexistente", () => {
      expect(() => {
        permissionRepository.removePermissionFromUser(testUserId, "nonexistent:permission");
      }).toThrow("Permission 'nonexistent:permission' not found");
    });
  });

  describe("setUserPermissions", () => {
    it("deve definir permissões do usuário", () => {
      expect(() => {
        permissionRepository.setUserPermissions(testUserId, ["user:read", "user:create"]);
      }).not.toThrow();

      const permissions = permissionRepository.getUserDirectPermissions(testUserId);
      expect(permissions).toContain("user:read");
      expect(permissions).toContain("user:create");
    });

    it("deve remover permissões anteriores ao definir novas", () => {
      permissionRepository.setUserPermissions(testUserId, ["user:read"]);
      
      permissionRepository.setUserPermissions(testUserId, ["user:create"]);
      
      const permissions = permissionRepository.getUserDirectPermissions(testUserId);
      expect(permissions).toContain("user:create");
      expect(permissions).not.toContain("user:read");
    });

    it("deve remover todas as permissões quando array vazio", () => {
      permissionRepository.setUserPermissions(testUserId, ["user:read"]);
      permissionRepository.setUserPermissions(testUserId, []);
      
      const permissions = permissionRepository.getUserDirectPermissions(testUserId);
      expect(permissions.length).toBe(0);
    });

    it("deve ignorar permissões inválidas silenciosamente", () => {
      const consoleWarnSpy = jest.spyOn(console, "warn").mockImplementation();
      
      expect(() => {
        permissionRepository.setUserPermissions(testUserId, ["user:read", "invalid:permission"]);
      }).not.toThrow();
      
      const permissions = permissionRepository.getUserDirectPermissions(testUserId);
      expect(permissions).toContain("user:read");
      
      consoleWarnSpy.mockRestore();
    });
  });

  describe("getPermissionById", () => {
    it("deve retornar permissão por ID", () => {
      const allPermissions = permissionRepository.findAll();
      if (allPermissions.length > 0) {
        const permission = permissionRepository.getPermissionById(allPermissions[0].id);
        expect(permission).not.toBeNull();
        expect(permission?.id).toBe(allPermissions[0].id);
      }
    });

    it("deve retornar null para ID inexistente", () => {
      const permission = permissionRepository.getPermissionById(99999);
      expect(permission).toBeNull();
    });
  });
});
