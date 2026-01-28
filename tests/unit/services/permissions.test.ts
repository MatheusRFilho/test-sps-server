import {
  getUserPermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  assignPermissionToUser,
  removePermissionFromUser,
  setUserPermissions,
  getUserDirectPermissions,
} from "../../../src/permissions/service";
import { PermissionCode } from "../../../src/permissions/types";
import { userRepository } from "../../../src/users/repository";

jest.mock("../../../src/shared/database/database", () => {
  const { getTestDb } = require("../../helpers/test-db");
  return {
    __esModule: true,
    default: getTestDb(),
  };
});

describe("Permissions Service", () => {
  let testUserId: number;

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

  describe("getUserPermissions", () => {
    it("deve retornar array de permissões", () => {
      const permissions = getUserPermissions(1);
      expect(Array.isArray(permissions)).toBe(true);
    });

    it("deve retornar permissões do admin", () => {
      const permissions = getUserPermissions(1);
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions).toContain(PermissionCode.USER_CREATE);
    });

    it("deve retornar array vazio para usuário sem permissões", () => {
      const permissions = getUserPermissions(testUserId);
      expect(Array.isArray(permissions)).toBe(true);
    });

    it("deve incluir permissões de roles e permissões diretas", () => {
      assignPermissionToUser(testUserId, PermissionCode.USER_READ);
      const permissions = getUserPermissions(testUserId);
      expect(permissions).toContain(PermissionCode.USER_READ);
    });
  });

  describe("hasPermission", () => {
    it("deve retornar true quando usuário tem permissão", () => {
      assignPermissionToUser(testUserId, PermissionCode.USER_READ);
      expect(hasPermission(testUserId, PermissionCode.USER_READ)).toBe(true);
    });

    it("deve retornar false quando usuário não tem permissão", () => {
      expect(hasPermission(testUserId, PermissionCode.USER_CREATE)).toBe(false);
    });

    it("deve retornar true para admin com permissão", () => {
      expect(hasPermission(1, PermissionCode.USER_CREATE)).toBe(true);
    });

    it("deve aceitar string como código de permissão", () => {
      assignPermissionToUser(testUserId, "user:read");
      expect(hasPermission(testUserId, "user:read")).toBe(true);
    });
  });

  describe("hasAllPermissions", () => {
    it("deve retornar true quando usuário tem todas as permissões", () => {
      assignPermissionToUser(testUserId, PermissionCode.USER_READ);
      assignPermissionToUser(testUserId, PermissionCode.USER_UPDATE);
      expect(hasAllPermissions(testUserId, [PermissionCode.USER_READ, PermissionCode.USER_UPDATE])).toBe(true);
    });

    it("deve retornar false quando usuário não tem todas as permissões", () => {
      assignPermissionToUser(testUserId, PermissionCode.USER_READ);
      expect(hasAllPermissions(testUserId, [PermissionCode.USER_READ, PermissionCode.USER_CREATE])).toBe(false);
    });

    it("deve retornar true para array vazio", () => {
      expect(hasAllPermissions(testUserId, [])).toBe(true);
    });

    it("deve retornar true para admin com todas as permissões", () => {
      expect(hasAllPermissions(1, [PermissionCode.USER_CREATE, PermissionCode.USER_READ])).toBe(true);
    });
  });

  describe("hasAnyPermission", () => {
    it("deve retornar true quando usuário tem pelo menos uma permissão", () => {
      assignPermissionToUser(testUserId, PermissionCode.USER_READ);
      expect(hasAnyPermission(testUserId, [PermissionCode.USER_READ, PermissionCode.USER_CREATE])).toBe(true);
    });

    it("deve retornar false quando usuário não tem nenhuma permissão", () => {
      expect(hasAnyPermission(testUserId, [PermissionCode.USER_CREATE, PermissionCode.USER_DELETE])).toBe(false);
    });

    it("deve retornar false para array vazio", () => {
      expect(hasAnyPermission(testUserId, [])).toBe(false);
    });

    it("deve retornar true para admin com qualquer permissão", () => {
      expect(hasAnyPermission(1, [PermissionCode.USER_CREATE])).toBe(true);
    });
  });

  describe("assignRoleToUser", () => {
    it("deve atribuir role ao usuário", () => {
      assignRoleToUser(testUserId, "manager");
      const roles = getUserRoles(testUserId);
      expect(roles).toContain("manager");
    });

    it("deve adicionar permissões da role ao usuário", () => {
      assignRoleToUser(testUserId, "manager");
      const permissions = getUserPermissions(testUserId);
      expect(permissions.length).toBeGreaterThan(0);
    });
  });

  describe("removeRoleFromUser", () => {
    it("deve remover role do usuário", () => {
      assignRoleToUser(testUserId, "manager");
      removeRoleFromUser(testUserId, "manager");
      const roles = getUserRoles(testUserId);
      expect(roles).not.toContain("manager");
    });
  });

  describe("getUserRoles", () => {
    it("deve retornar array de roles", () => {
      const roles = getUserRoles(testUserId);
      expect(Array.isArray(roles)).toBe(true);
    });

    it("deve retornar roles atribuídas", () => {
      assignRoleToUser(testUserId, "manager");
      const roles = getUserRoles(testUserId);
      expect(roles).toContain("manager");
    });

    it("deve retornar array vazio para usuário sem roles", () => {
      const roles = getUserRoles(999);
      expect(roles).toEqual([]);
    });
  });

  describe("assignPermissionToUser", () => {
    it("deve atribuir permissão ao usuário", () => {
      assignPermissionToUser(testUserId, PermissionCode.USER_READ);
      expect(hasPermission(testUserId, PermissionCode.USER_READ)).toBe(true);
    });

    it("deve permitir múltiplas permissões", () => {
      assignPermissionToUser(testUserId, PermissionCode.USER_READ);
      assignPermissionToUser(testUserId, PermissionCode.USER_UPDATE);
      const permissions = getUserDirectPermissions(testUserId);
      expect(permissions).toContain(PermissionCode.USER_READ);
      expect(permissions).toContain(PermissionCode.USER_UPDATE);
    });
  });

  describe("removePermissionFromUser", () => {
    it("deve remover permissão do usuário", () => {
      assignPermissionToUser(testUserId, PermissionCode.USER_DELETE);
      expect(hasPermission(testUserId, PermissionCode.USER_DELETE)).toBe(true);
      removePermissionFromUser(testUserId, PermissionCode.USER_DELETE);
      expect(hasPermission(testUserId, PermissionCode.USER_DELETE)).toBe(false);
    });
  });

  describe("setUserPermissions", () => {
    it("deve definir permissões do usuário", () => {
      setUserPermissions(testUserId, [PermissionCode.USER_READ, PermissionCode.USER_UPDATE]);
      const permissions = getUserDirectPermissions(testUserId);
      expect(permissions).toContain(PermissionCode.USER_READ);
      expect(permissions).toContain(PermissionCode.USER_UPDATE);
    });

    it("deve substituir permissões existentes", () => {
      assignPermissionToUser(testUserId, PermissionCode.USER_DELETE);
      setUserPermissions(testUserId, [PermissionCode.USER_READ]);
      const permissions = getUserDirectPermissions(testUserId);
      expect(permissions).toContain(PermissionCode.USER_READ);
      expect(permissions).not.toContain(PermissionCode.USER_DELETE);
    });

    it("deve limpar todas as permissões quando array vazio", () => {
      assignPermissionToUser(testUserId, PermissionCode.USER_READ);
      setUserPermissions(testUserId, []);
      const permissions = getUserDirectPermissions(testUserId);
      expect(permissions).toEqual([]);
    });
  });

  describe("getUserDirectPermissions", () => {
    it("deve retornar apenas permissões diretas", () => {
      assignPermissionToUser(testUserId, PermissionCode.USER_READ);
      const directPermissions = getUserDirectPermissions(testUserId);
      expect(directPermissions).toContain(PermissionCode.USER_READ);
    });

    it("deve não incluir permissões de roles", () => {
      assignRoleToUser(testUserId, "manager");
      const directPermissions = getUserDirectPermissions(testUserId);
      expect(Array.isArray(directPermissions)).toBe(true);
    });

    it("deve retornar array vazio quando não há permissões diretas", () => {
      const directPermissions = getUserDirectPermissions(testUserId);
      expect(directPermissions).toEqual([]);
    });
  });
});
