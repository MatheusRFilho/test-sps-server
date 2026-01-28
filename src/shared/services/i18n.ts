import * as fs from "fs";
import * as path from "path";
import { Response, NextFunction } from "express";
import { SupportedLanguage, AuthenticatedRequest } from "../types";

export const SUPPORTED_LANGUAGES: SupportedLanguage[] = ["pt", "en", "es"];
export const DEFAULT_LANGUAGE: SupportedLanguage = "en";

interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<SupportedLanguage, Translations> = {} as Record<SupportedLanguage, Translations>;

SUPPORTED_LANGUAGES.forEach((lang) => {
  const filePath = path.join(__dirname, "../locales", `${lang}.json`);
  try {
    const fileContent = fs.readFileSync(filePath, "utf8");
    translations[lang] = JSON.parse(fileContent);
  } catch (error: any) {
    translations[lang] = {};
  }
});

export function translate(language: string | undefined, key: string, params: Record<string, string> = {}): string {
  const lang: SupportedLanguage = SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)
    ? (language as SupportedLanguage)
    : DEFAULT_LANGUAGE;

  const keys = key.split(".");
  let message: any = translations[lang];

  for (const k of keys) {
    if (message && typeof message === "object" && k in message) {
      message = message[k];
    } else {
      let defaultMessage: any = translations[DEFAULT_LANGUAGE];
      for (const dk of keys) {
        if (defaultMessage && typeof defaultMessage === "object" && dk in defaultMessage) {
          defaultMessage = defaultMessage[dk];
        } else {
          return key;
        }
      }
      message = defaultMessage;
      break;
    }
  }

  if (typeof message !== "string") {
    return key;
  }

  return message.replace(/\{(\w+)\}/g, (match: string, paramKey: string) => {
    return params[paramKey] !== undefined ? params[paramKey] : match;
  });
}

export function i18nMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (req.userLanguage) {
    req.language = req.userLanguage;
  } else if (req.user && req.user.language) {
    req.language = req.user.language;
  } else {
    const acceptLanguage = req.headers["accept-language"];
    const queryLang = req.query.lang as string;

    if (queryLang && SUPPORTED_LANGUAGES.includes(queryLang as SupportedLanguage)) {
      req.language = queryLang as SupportedLanguage;
    } else if (acceptLanguage) {
      const lang = acceptLanguage.split(",")[0].split("-")[0].toLowerCase();
      req.language = SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage)
        ? (lang as SupportedLanguage)
        : DEFAULT_LANGUAGE;
    } else {
      req.language = DEFAULT_LANGUAGE;
    }
  }

  req.t = (key: string, params?: Record<string, string>) => translate(req.language, key, params);

  next();
}
