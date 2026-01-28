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

describe("Auth E2E Tests", () => {
  let app: Express;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    clearTestDb();
  });

  describe("POST /auth/login", () => {
    it("deve fazer login com credenciais válidas", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "admin@spsgroup.com.br",
          password: "1234",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.email).toBe("admin@spsgroup.com.br");
      expect(response.body.user).toHaveProperty("permissions");
    });

    it("deve retornar erro 401 com credenciais inválidas", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "admin@spsgroup.com.br",
          password: "senha-errada",
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error");
    });

    it("deve retornar erro 400 com email inválido", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "email-invalido",
          password: "1234",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("deve retornar erro 400 com campos faltando", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "admin@spsgroup.com.br",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar erro 401 para usuário inexistente", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "nonexistent@example.com",
          password: "1234",
        });

      expect(response.status).toBe(401);
    });

    it("deve retornar erro 400 com senha faltando", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "admin@spsgroup.com.br",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar erro 400 com email vazio", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "",
          password: "1234",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar erro 400 com senha vazia", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "admin@spsgroup.com.br",
          password: "",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar token JWT válido", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "admin@spsgroup.com.br",
          password: "1234",
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeTruthy();
      expect(typeof response.body.token).toBe("string");
      expect(response.body.token.split(".").length).toBe(3);
    });

    it("deve retornar informações do usuário sem senha", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({
          email: "admin@spsgroup.com.br",
          password: "1234",
        });

      expect(response.status).toBe(200);
      expect(response.body.user).not.toHaveProperty("password");
      expect(response.body.user).toHaveProperty("id");
      expect(response.body.user).toHaveProperty("email");
      expect(response.body.user).toHaveProperty("name");
    });
  });

  describe("POST /auth/forgot-password", () => {
    it("deve retornar sucesso mesmo se email não existir (segurança)", async () => {
      const response = await request(app)
        .post("/auth/forgot-password")
        .send({
          email: "nonexistent@example.com",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
    });

    it("deve retornar erro 400 com email inválido", async () => {
      const response = await request(app)
        .post("/auth/forgot-password")
        .send({
          email: "email-invalido",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar erro 400 sem email", async () => {
      const response = await request(app)
        .post("/auth/forgot-password")
        .send({});

      expect(response.status).toBe(400);
    });

    it("deve retornar sucesso com email válido existente", async () => {
      const response = await request(app)
        .post("/auth/forgot-password")
        .send({
          email: "admin@spsgroup.com.br",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message");
    });

    it("deve retornar erro 400 com email vazio", async () => {
      const response = await request(app)
        .post("/auth/forgot-password")
        .send({
          email: "",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /auth/reset-password", () => {
    it("deve retornar erro 400 com token inválido", async () => {
      const response = await request(app)
        .post("/auth/reset-password")
        .send({
          token: "invalid-token",
          password: "newpassword123",
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty("error");
    });

    it("deve retornar erro 400 sem token", async () => {
      const response = await request(app)
        .post("/auth/reset-password")
        .send({
          password: "newpassword123",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar erro 400 com senha muito curta", async () => {
      const response = await request(app)
        .post("/auth/reset-password")
        .send({
          token: "some-token",
          password: "123",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar erro 400 com senha muito longa", async () => {
      const response = await request(app)
        .post("/auth/reset-password")
        .send({
          token: "some-token",
          password: "a".repeat(1000),
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar erro 400 sem senha", async () => {
      const response = await request(app)
        .post("/auth/reset-password")
        .send({
          token: "some-token",
        });

      expect(response.status).toBe(400);
    });

    it("deve retornar erro 400 com token vazio", async () => {
      const response = await request(app)
        .post("/auth/reset-password")
        .send({
          token: "",
          password: "newpassword123",
        });

      expect(response.status).toBe(400);
    });
  });
});
