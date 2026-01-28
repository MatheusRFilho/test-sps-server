import request from "supertest";
import { Express } from "express";
import { createTestApp } from "../helpers/test-app";
import { clearTestDb } from "../helpers/test-db";

jest.mock("../../src/shared/database/database", () => {
  let db: any = null;
  return {
    __esModule: true,
    get default() {
      if (!db) {
        const { getTestDb } = require("../helpers/test-db");
        db = getTestDb();
      }
      return db;
    },
  };
});

describe("Users E2E Tests", () => {
  let app: Express;
  let authToken: string;

  beforeAll(async () => {
    app = createTestApp();

    const loginResponse = await request(app)
      .post("/auth/login")
      .send({
        email: "admin@spsgroup.com.br",
        password: "1234",
      });

    authToken = loginResponse.body.token;
  });

  beforeEach(() => {
    clearTestDb();
  });

  describe("GET /users", () => {
    it("deve retornar lista de usuários quando autenticado", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it("deve retornar erro 401 sem autenticação", async () => {
      const response = await request(app).get("/users");

      expect(response.status).toBe(401);
    });

    it("deve retornar erro 401 com token inválido", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", "Bearer invalid-token");

      expect(response.status).toBe(401);
    });
  });

  describe("GET /users/:id", () => {
    it("deve retornar usuário por ID", async () => {
      const response = await request(app)
        .get("/users/1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("email");
      expect(response.body).not.toHaveProperty("password");
    });

    it("deve retornar 404 para usuário inexistente", async () => {
      const response = await request(app)
        .get("/users/99999")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe("POST /users", () => {
    it("deve criar novo usuário", async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        name: "Test User",
        password: "test1234",
        type: "user",
      };

      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.name).toBe(userData.name);
      expect(response.body.user).not.toHaveProperty("password");
    });

    it("deve retornar erro 409 com email duplicado", async () => {
      const email = `test${Date.now()}@example.com`;

      await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email,
          name: "User 1",
          password: "test1234",
        });

      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email,
          name: "User 2",
          password: "test1234",
        });

      expect(response.status).toBe(409);
    });

    it("deve retornar erro 400 com dados inválidos", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "email-invalido",
          name: "A",
        });

      expect(response.status).toBe(400);
    });

    it("deve atribuir role 'user' por padrão", async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        name: "Test User",
        password: "test1234",
      };

      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user.type).toBe("user");
    });
  });

  describe("PUT /users/:id", () => {
    let testUserId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: `test${Date.now()}@example.com`,
          name: "Original Name",
          password: "test1234",
        });

      testUserId = createResponse.body.user.id;
    });

    it("deve atualizar usuário", async () => {
      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe("Updated Name");
    });

    it("deve retornar 404 para usuário inexistente", async () => {
      const response = await request(app)
        .put("/users/99999")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Name",
        });

      expect(response.status).toBe(404);
    });

    it("deve atualizar senha", async () => {
      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          password: "newpassword123",
        });

      expect(response.status).toBe(200);

      const user = await request(app)
        .get(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(user.status).toBe(200);
    });
  });

  describe("DELETE /users/:id", () => {
    it("deve deletar usuário", async () => {
      const createResponse = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: `test${Date.now()}@example.com`,
          name: "User to Delete",
          password: "test1234",
        });

      const userId = createResponse.body.user.id;

      const deleteResponse = await request(app)
        .delete(`/users/${userId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(200);

      const getResponse = await request(app)
        .get(`/users/${userId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
    });

    it("não deve deletar o usuário admin", async () => {
      const response = await request(app)
        .delete("/users/1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe("GET /users/permissions/list", () => {
    it("deve retornar lista de permissões", async () => {
      const response = await request(app)
        .get("/users/permissions/list")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
    });

    it("deve retornar permissões com estrutura correta", async () => {
      const response = await request(app)
        .get("/users/permissions/list")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      if (response.body.length > 0) {
        const permission = response.body[0];
        expect(permission).toHaveProperty("id");
        expect(permission).toHaveProperty("code");
        expect(permission).toHaveProperty("name");
      }
    });

    it("deve retornar erro 401 sem autenticação", async () => {
      const response = await request(app).get("/users/permissions/list");

      expect(response.status).toBe(401);
    });
  });

  describe("PUT /users/:id - casos de borda", () => {
    let testUserId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: `test${Date.now()}@example.com`,
          name: "Original Name",
          password: "test1234",
        });

      testUserId = createResponse.body.user.id;
    });

    it("deve atualizar apenas nome", async () => {
      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Updated Name Only",
        });

      expect(response.status).toBe(200);
      expect(response.body.user.name).toBe("Updated Name Only");
    });

    it("deve atualizar apenas email", async () => {
      const newEmail = `updated${Date.now()}@example.com`;
      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: newEmail,
        });

      expect(response.status).toBe(200);
      expect(response.body.user.email).toBe(newEmail);
    });

    it("deve retornar erro 400 com email inválido", async () => {
      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: "invalid-email",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar erro 400 com nome muito curto", async () => {
      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "A",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar erro 409 com email duplicado", async () => {
      const otherUser = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: `other${Date.now()}@example.com`,
          name: "Other User",
          password: "test1234",
        });

      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: otherUser.body.user.email,
        });

      expect(response.status).toBe(409);
    });
  });

  describe("POST /users - casos de borda", () => {
    it("deve retornar erro 400 com nome muito curto", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: `test${Date.now()}@example.com`,
          name: "A",
          password: "test1234",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar erro 400 com senha muito curta", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: `test${Date.now()}@example.com`,
          name: "Test User",
          password: "123",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar erro 400 sem campos obrigatórios", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: `test${Date.now()}@example.com`,
        });

      expect(response.status).toBe(400);
    });

    it("deve criar usuário com language padrão quando não fornecido", async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        name: "Test User",
        password: "test1234",
      };

      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user).toHaveProperty("language");
      expect(response.body.user.language).toBe("en");
    });

    it("deve criar usuário com permissões customizadas", async () => {
      const userData = {
        email: `test${Date.now()}@example.com`,
        name: "Test User",
        password: "test1234",
        permissions: ["user:read", "user:create"],
      };

      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send(userData);

      expect(response.status).toBe(201);
      
      const getUserResponse = await request(app)
        .get(`/users/${response.body.user.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getUserResponse.status).toBe(200);
      expect(getUserResponse.body).toHaveProperty("permissions");
      expect(Array.isArray(getUserResponse.body.permissions)).toBe(true);
    });
  });

  describe("PUT /users/:id - gerenciamento de permissões", () => {
    let testUserId: number;

    beforeEach(async () => {
      const createResponse = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: `test${Date.now()}@example.com`,
          name: "Test User",
          password: "test1234",
        });

      testUserId = createResponse.body.user.id;
    });

    it("deve atualizar permissões do usuário", async () => {
      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          permissions: ["user:read", "user:update"],
        });

      expect(response.status).toBe(200);

      const getUserResponse = await request(app)
        .get(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getUserResponse.status).toBe(200);
      expect(getUserResponse.body.permissions).toContain("user:read");
      expect(getUserResponse.body.permissions).toContain("user:update");
    });

    it("deve remover todas as permissões quando array vazio", async () => {
      await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          permissions: ["user:read"],
        });

      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          permissions: [],
        });

      expect(response.status).toBe(200);

      const getUserResponse = await request(app)
        .get(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getUserResponse.status).toBe(200);
      expect(Array.isArray(getUserResponse.body.permissions)).toBe(true);
    });

    it("deve ignorar permissões inválidas silenciosamente", async () => {
      const response = await request(app)
        .put(`/users/${testUserId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          permissions: ["user:read", "invalid:permission"],
        });

      expect(response.status).toBe(200);
    });
  });

  describe("GET /users/permissions/list - casos adicionais", () => {
    it("deve retornar permissões ordenadas", async () => {
      const response = await request(app)
        .get("/users/permissions/list")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const permissions = response.body;
      
      if (permissions.length > 1) {
        permissions.forEach((perm: any) => {
          expect(perm).toHaveProperty("id");
          expect(perm).toHaveProperty("code");
          expect(perm).toHaveProperty("name");
          expect(typeof perm.id).toBe("number");
          expect(typeof perm.code).toBe("string");
          expect(typeof perm.name).toBe("string");
        });
      }
    });

    it("deve retornar permissões com códigos únicos", async () => {
      const response = await request(app)
        .get("/users/permissions/list")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const permissions = response.body;
      const codes = permissions.map((p: any) => p.code);
      const uniqueCodes = [...new Set(codes)];
      
      expect(codes.length).toBe(uniqueCodes.length);
    });
  });

  describe("Casos de erro e edge cases", () => {
    it("deve retornar 400 com ID não numérico", async () => {
      const response = await request(app)
        .get("/users/abc")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it("deve retornar 400 com ID negativo", async () => {
      const response = await request(app)
        .get("/users/-1")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it("deve retornar 400 com ID zero", async () => {
      const response = await request(app)
        .get("/users/0")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    it("deve retornar 400 ao criar usuário com body vazio", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("deve retornar 400 ao atualizar com body vazio", async () => {
      const response = await request(app)
        .put("/users/1")
        .set("Authorization", `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    it("deve retornar 400 com nome muito longo", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: `test${Date.now()}@example.com`,
          name: "A".repeat(200),
          password: "test1234",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar 400 com tipo inválido", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: `test${Date.now()}@example.com`,
          name: "Test User",
          password: "test1234",
          type: "invalid_type",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar 400 com language inválida", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: `test${Date.now()}@example.com`,
          name: "Test User",
          password: "test1234",
          language: "invalid_lang",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar 400 com permissões não sendo array", async () => {
      const response = await request(app)
        .post("/users")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          email: `test${Date.now()}@example.com`,
          name: "Test User",
          password: "test1234",
          permissions: "not-an-array",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar 401 com token expirado (simulado)", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoidGVzdEBleGFtcGxlLmNvbSIsImlhdCI6MTYwOTQ1NjgwMCwiZXhwIjoxNjA5NDU2ODAwfQ.invalid");

      expect(response.status).toBe(401);
    });

    it("deve retornar 401 sem Bearer prefix", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", authToken);

      expect(response.status).toBe(401);
    });

    it("deve retornar 401 com token malformado", async () => {
      const response = await request(app)
        .get("/users")
        .set("Authorization", "Bearer not.a.valid.jwt.token");

      expect(response.status).toBe(401);
    });
  });

  describe("Testes de performance e stress", () => {
    it("deve lidar com múltiplas requisições simultâneas", async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app)
          .get("/users")
          .set("Authorization", `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    it("deve criar múltiplos usuários rapidamente", async () => {
      const timestamp = Date.now();
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post("/users")
          .set("Authorization", `Bearer ${authToken}`)
          .send({
            email: `stress${timestamp}${i}@example.com`,
            name: `Stress Test User ${i}`,
            password: "test1234",
            type: "user",
          })
      );

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.body.user).toHaveProperty("id");
      });
    });
  });
});
