import request from "supertest";
import { Express } from "express";
import { createTestApp } from "../helpers/test-app";
import { clearTestDb } from "../helpers/test-db";

jest.mock("../../src/shared/database/database", () => {
  const { getTestDb } = require("../helpers/test-db");
  return {
    __esModule: true,
    default: getTestDb(),
  };
});

jest.mock("../../src/shared/services/email", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(undefined),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
  verifyEmailConfig: jest.fn().mockResolvedValue(true),
}));

describe("Integration E2E Tests", () => {
  let app: Express;
  let adminToken: string;
  let createdUserId: number;

  beforeAll(async () => {
    app = createTestApp();

    const adminLoginResponse = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@spsgroup.com.br",
        password: "1234",
      });

    adminToken = adminLoginResponse.body.token;
  });

  beforeEach(() => {
    clearTestDb();
  });

  describe("Fluxo completo: Criar -> Atualizar -> Deletar usuário", () => {
    it("deve criar, atualizar e deletar usuário com sucesso", async () => {
      const timestamp = Date.now();
      const userData = {
        email: `integration${timestamp}@example.com`,
        name: "Integration Test User",
        password: "test1234",
        type: "user" as const,
      };

      const createResponse = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(userData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.user).toHaveProperty("id");
      createdUserId = createResponse.body.user.id;

      const getResponse = await request(app)
        .get(`/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.email).toBe(userData.email);

      const updateData = {
        name: "Updated Integration User",
        language: "pt",
      };

      const updateResponse = await request(app)
        .put(`/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send(updateData);

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.user.name).toBe(updateData.name);

      const verifyResponse = await request(app)
        .get(`/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(verifyResponse.status).toBe(200);
      expect(verifyResponse.body.name).toBe(updateData.name);

      const deleteResponse = await request(app)
        .delete(`/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deleteResponse.status).toBe(200);

      const deletedResponse = await request(app)
        .get(`/users/${createdUserId}`)
        .set("Authorization", `Bearer ${adminToken}`);

      expect(deletedResponse.status).toBe(404);
    });
  });

  describe("Fluxo completo: Criar usuário -> Atribuir permissões -> Verificar acesso", () => {
    it("deve criar usuário, atribuir permissões e verificar acesso", async () => {
      const timestamp = Date.now();
      const userData = {
        email: `permissions${timestamp}@example.com`,
        name: "Permissions Test User",
        password: "test1234",
        type: "user" as const,
        permissions: ["user:read"],
      };

      const createResponse = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(userData);

      expect(createResponse.status).toBe(201);
      const userId = createResponse.body.user.id;

      const loginResponse = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.user.permissions).toContain("user:read");

      const updateResponse = await request(app)
        .put(`/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          permissions: ["user:read", "user:update"],
        });

      expect(updateResponse.status).toBe(200);

      const permissionsResponse = await request(app)
        .get("/users/permissions/list")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(permissionsResponse.status).toBe(200);
      expect(Array.isArray(permissionsResponse.body)).toBe(true);
    });
  });

  describe("Fluxo completo: Reset de senha -> Login com nova senha", () => {
    it("deve solicitar reset, resetar senha e fazer login", async () => {
      const timestamp = Date.now();
      const userData = {
        email: `reset${timestamp}@example.com`,
        name: "Reset Test User",
        password: "oldpassword123",
        type: "user" as const,
      };

      const createResponse = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(userData);

      expect(createResponse.status).toBe(201);

      const oldLoginResponse = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        });

      expect(oldLoginResponse.status).toBe(200);

      const forgotResponse = await request(app)
        .post("/auth/forgot-password")
        .send({
          email: userData.email,
        });

      expect(forgotResponse.status).toBe(200);

      const { userRepository } = require("../../src/users/repository");
      const user = userRepository.findByEmail(userData.email);
      expect(user).toBeTruthy();

      if (user && user.reset_token) {
        const resetResponse = await request(app)
          .post("/auth/reset-password")
          .send({
            token: user.reset_token,
            password: "newpassword123",
          });

        expect(resetResponse.status).toBe(200);

        const failedLoginResponse = await request(app)
          .post("/auth/login")
          .send({
            email: userData.email,
            password: userData.password,
          });

        expect(failedLoginResponse.status).toBe(401);

        const newLoginResponse = await request(app)
          .post("/auth/login")
          .send({
            email: userData.email,
            password: "newpassword123",
          });

        expect(newLoginResponse.status).toBe(200);
        expect(newLoginResponse.body).toHaveProperty("token");
      }
    });
  });

  describe("Fluxo completo: Múltiplos usuários e permissões", () => {
    it("deve criar múltiplos usuários com diferentes permissões", async () => {
      const timestamp = Date.now();
      const users = [
        {
          email: `user1${timestamp}@example.com`,
          name: "User 1",
          password: "test1234",
          permissions: ["user:read"],
        },
        {
          email: `user2${timestamp}@example.com`,
          name: "User 2",
          password: "test1234",
          permissions: ["user:read", "user:update"],
        },
        {
          email: `user3${timestamp}@example.com`,
          name: "User 3",
          password: "test1234",
          permissions: [],
        },
      ];

      const createdUsers: Array<{ id: number; email: string; name: string }> = [];

      for (const userData of users) {
        const response = await request(app)
          .post("/users")
          .set("Authorization", `Bearer ${adminToken}`)
          .send({
            ...userData,
            type: "user",
          });

        expect(response.status).toBe(201);
        expect(response.body.user).toBeDefined();
        if (response.body.user) {
          createdUsers.push(response.body.user);
        }
      }

      const listResponse = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(listResponse.status).toBe(200);
      expect(listResponse.body.length).toBeGreaterThanOrEqual(createdUsers.length);

      for (let i = 0; i < users.length; i++) {
        const loginResponse = await request(app)
          .post("/auth/login")
          .send({
            email: users[i].email,
            password: users[i].password,
          });

        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.user.permissions).toEqual(
          expect.arrayContaining(users[i].permissions)
        );
      }
    });
  });

  describe("Fluxo completo: Atualização em cascata de permissões", () => {
    it("deve atualizar permissões e verificar em múltiplas requisições", async () => {
      const timestamp = Date.now();
      const userData = {
        email: `cascade${timestamp}@example.com`,
        name: "Cascade Test User",
        password: "test1234",
        type: "user" as const,
        permissions: ["user:read"],
      };

      const createResponse = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .send(userData);

      expect(createResponse.status).toBe(201);
      const userId = createResponse.body.user.id;

      const initialLogin = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        });

      expect(initialLogin.body.user.permissions).toContain("user:read");

      await request(app)
        .put(`/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          permissions: ["user:read", "user:update"],
        });

      const updatedLogin = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        });

      expect(updatedLogin.body.user.permissions).toContain("user:read");
      expect(updatedLogin.body.user.permissions).toContain("user:update");

      await request(app)
        .put(`/users/${userId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          permissions: [],
        });

      const finalLogin = await request(app)
        .post("/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        });

      expect(finalLogin.status).toBe(200);
      expect(finalLogin.body.user.permissions).not.toContain("user:update");
      expect(finalLogin.body.user.permissions).toContain("user:read");
    });
  });
});
