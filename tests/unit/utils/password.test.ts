import { hashPasswordSync, comparePasswordSync, hashPassword, comparePassword } from "../../../src/shared/utils/password";

describe("Password Utils", () => {
  describe("hashPasswordSync", () => {
    it("deve gerar hash diferente para mesma senha", () => {
      const password = "test123";
      const hash1 = hashPasswordSync(password);
      const hash2 = hashPasswordSync(password);

      expect(hash1).not.toBe(hash2);
      expect(hash1).toMatch(/^\$2[aby]\$/);
      expect(hash2).toMatch(/^\$2[aby]\$/);
    });

    it("deve gerar hash válido", () => {
      const password = "test123";
      const hash = hashPasswordSync(password);

      expect(hash).toBeTruthy();
      expect(hash.length).toBeGreaterThan(20);
      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe("comparePasswordSync", () => {
    it("deve retornar true para senha correta", () => {
      const password = "test123";
      const hash = hashPasswordSync(password);

      expect(comparePasswordSync(password, hash)).toBe(true);
    });

    it("deve retornar false para senha incorreta", () => {
      const password = "test123";
      const wrongPassword = "wrong123";
      const hash = hashPasswordSync(password);

      expect(comparePasswordSync(wrongPassword, hash)).toBe(false);
    });
  });

  describe("hashPassword (async)", () => {
    it("deve gerar hash assincronamente", async () => {
      const password = "test123";
      const hash = await hashPassword(password);

      expect(hash).toBeTruthy();
      expect(hash).toMatch(/^\$2[aby]\$/);
    });
  });

  describe("comparePassword (async)", () => {
    it("deve comparar senha assincronamente", async () => {
      const password = "test123";
      const hash = await hashPassword(password);

      const isValid = await comparePassword(password, hash);
      expect(isValid).toBe(true);

      const isInvalid = await comparePassword("wrong", hash);
      expect(isInvalid).toBe(false);
    });
  });
});
