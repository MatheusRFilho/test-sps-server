import { SupportedLanguage } from "../shared/types";

export class User {
  constructor(
    public id: number,
    public name: string,
    public email: string,
    public type: "admin" | "manager" | "user",
    public language: SupportedLanguage,
    public password?: string,
    public resetToken?: string | null,
    public resetTokenExpires?: Date | null
  ) {}

  static fromDatabase(row: any): User {
    return new User(
      row.id,
      row.name,
      row.email,
      row.type,
      row.language,
      row.password,
      row.reset_token || null,
      row.reset_token_expires ? new Date(row.reset_token_expires) : null
    );
  }

  toJSON(): Omit<User, "password" | "toJSON"> {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword as Omit<User, "password" | "toJSON">;
  }
}

export interface CreateUserData {
  email: string;
  name: string;
  type?: "admin" | "manager" | "user";
  password: string;
  language?: SupportedLanguage;
  permissions?: string[];
}

export interface UpdateUserData {
  email?: string;
  name?: string;
  type?: "admin" | "manager" | "user";
  password?: string;
  language?: SupportedLanguage;
  permissions?: string[];
}
