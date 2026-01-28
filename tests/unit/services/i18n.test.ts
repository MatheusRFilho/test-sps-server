import { translate, SUPPORTED_LANGUAGES } from "../../../src/shared/services/i18n";

describe("i18n Service", () => {
  describe("translate", () => {
    it("deve traduzir chave existente", () => {
      const result = translate("en", "errors.invalid_credentials");
      expect(result).toBeTruthy();
      expect(result).not.toBe("errors.invalid_credentials");
    });

    it("deve usar idioma padrão quando chave não existe no idioma solicitado", () => {
      const result = translate("en", "errors.invalid_credentials");
      expect(result).toBeTruthy();
    });

    it("deve retornar a chave quando não encontrar tradução", () => {
      const result = translate("en", "nonexistent.key");
      expect(result).toBe("nonexistent.key");
    });

    it("deve substituir parâmetros", () => {
      const result = translate("en", "permissions.insufficient_permissions", { permission: "user:create" });
      expect(result).toContain("user:create");
    });

    it("deve funcionar com todos os idiomas suportados", () => {
      SUPPORTED_LANGUAGES.forEach((lang) => {
        const result = translate(lang, "errors.invalid_credentials");
        expect(result).toBeTruthy();
        expect(typeof result).toBe("string");
      });
    });

    it("deve usar idioma padrão quando idioma inválido", () => {
      const result = translate("invalid" as any, "errors.invalid_credentials");
      expect(result).toBeTruthy();
    });
  });
});
