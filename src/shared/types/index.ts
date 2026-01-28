import { Request } from "express";

export type SupportedLanguage = "pt" | "en" | "es";

export interface User {
  id: number;
  name: string;
  email: string;
  type: "admin" | "manager" | "user";
  language: SupportedLanguage;
  password?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateUserRequest {
  email: string;
  name: string;
  type?: "admin" | "manager" | "user";
  password: string;
  language?: SupportedLanguage;
  permissions?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  type?: "admin" | "manager" | "user";
  password?: string;
  language?: SupportedLanguage;
  permissions?: string[];
}

export interface AuthenticatedRequest extends Request {
  userId?: number;
  userEmail?: string;
  userType?: "admin" | "manager" | "user";
  userLanguage?: SupportedLanguage;
  language?: SupportedLanguage;
  t?: (key: string, params?: Record<string, string>) => string;
  user?: User;
  permissions?: string[];
}

export interface JWTPayload {
  userId: number;
  email: string;
  type: "admin" | "manager" | "user";
  language: SupportedLanguage;
}
