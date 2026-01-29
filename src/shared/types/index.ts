import { Request } from "express";

export type SupportedLanguage = "pt" | "en" | "es";
export type SupportedTheme = "light" | "dark" | "system";

export interface User {
  id: number;
  name: string;
  email: string;
  type: "admin" | "manager" | "user";
  language: SupportedLanguage;
  theme: SupportedTheme;
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
  theme?: SupportedTheme;
  permissions?: string[];
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  type?: "admin" | "manager" | "user";
  password?: string;
  language?: SupportedLanguage;
  theme?: SupportedTheme;
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

export interface UserPreferencesRequest {
  language?: SupportedLanguage;
  theme?: SupportedTheme;
}

export interface PaginationQuery {
  page?: string;
  limit?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  search?: string;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface JWTPayload {
  userId: number;
  email: string;
  type: "admin" | "manager" | "user";
  language: SupportedLanguage;
}
