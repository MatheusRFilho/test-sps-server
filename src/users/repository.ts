import { User, CreateUserData, UpdateUserData } from "./entity";
import { userQueries } from "./queries";
import { permissionQueries } from "../permissions/queries";
import { hashPasswordSync } from "../shared/utils/password";
import { assignRoleToUser, setUserPermissions } from "../permissions/service";

interface CountResult {
  count: number;
}

export class UserRepository {
  findAll(): User[] {
    const stmt = userQueries.getAllUsers();
    const rows = stmt.all() as any[];
    return rows.map((row) => User.fromDatabase(row));
  }

  findById(id: number): User | null {
    const stmt = userQueries.getUserById();
    const row = stmt.get(id) as any | undefined;
    return row ? User.fromDatabase(row) : null;
  }

  findByEmail(email: string): User | null {
    const stmt = userQueries.getUserByEmail();
    const row = stmt.get(email) as any | undefined;
    return row ? User.fromDatabase(row) : null;
  }

  emailExists(email: string): boolean {
    const stmt = userQueries.emailExists();
    const result = stmt.get(email) as CountResult;
    return result.count > 0;
  }

  create(data: CreateUserData): User {
    const { email, name, type, password, language, permissions } = data;

    if (this.emailExists(email)) {
      throw new Error("EMAIL_ALREADY_REGISTERED");
    }

    const hashedPassword = hashPasswordSync(password);

    try {
      const stmt = userQueries.createUser();
      const result = stmt.run(email, name, type || "user", hashedPassword, language || "en");

      const userId = Number(result.lastInsertRowid);

      try {
        assignRoleToUser(userId, "user");
      } catch (error) {
        throw new Error("FAILED_TO_ASSIGN_USER_ROLE");
      }

      if (permissions && permissions.length > 0) {
        try {
          setUserPermissions(userId, permissions);
        } catch (error) {
          throw new Error("FAILED_TO_SET_USER_PERMISSIONS");
        }
      }

      const createdUser = this.findById(userId);
      if (!createdUser) {
        throw new Error("Failed to create user");
      }
      return createdUser;
    } catch (error: any) {
      if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
        throw new Error("EMAIL_ALREADY_REGISTERED");
      }
      throw error;
    }
  }

  update(id: number, data: UpdateUserData): User {
    const { email, name, type, password, language, permissions } = data;

    const existingUser = this.findById(id);
    if (!existingUser) {
      throw new Error("USER_NOT_FOUND");
    }

    if (email && email !== existingUser.email && this.emailExists(email)) {
      throw new Error("EMAIL_ALREADY_REGISTERED");
    }

    const updates: string[] = [];
    const values: any[] = [];

    if (email) {
      updates.push("email = ?");
      values.push(email);
    }
    if (name) {
      updates.push("name = ?");
      values.push(name);
    }
    if (type) {
      updates.push("type = ?");
      values.push(type);

      try {
        const userId = id;
        const getUserRolesStmt = permissionQueries.getUserRoles();
        const currentRoles = getUserRolesStmt.all(userId) as { code: string }[];
        const hasUserRole = currentRoles.some((r) => r.code === "user");

        if (!hasUserRole) {
          assignRoleToUser(userId, "user");
        }
      } catch (error) {
      }
    }
    if (password) {
      updates.push("password = ?");
      values.push(hashPasswordSync(password));
    }
    if (language !== undefined) {
      updates.push("language = ?");
      values.push(language);
    }

    if (updates.length === 0 && !permissions) {
      return existingUser;
    }

    if (updates.length > 0) {
      values.push(id);

      try {
        const stmt = userQueries.updateUser(updates);
        stmt.run(...values);
      } catch (error: any) {
        if (error.code === "SQLITE_CONSTRAINT_UNIQUE") {
          throw new Error("EMAIL_ALREADY_REGISTERED");
        }
        throw error;
      }
    }

    if (permissions !== undefined) {
      try {
        setUserPermissions(id, permissions);
      } catch (error) {
        throw new Error("FAILED_TO_UPDATE_USER_PERMISSIONS");
      }
    }

    const updatedUser = this.findById(id);
    if (!updatedUser) {
      throw new Error("Failed to update user");
    }
    return updatedUser;
  }

  delete(id: number): boolean {
    const user = this.findById(id);

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (user.email === "admin@spsgroup.com.br") {
      throw new Error("CANNOT_DELETE_ADMIN");
    }

    const stmt = userQueries.deleteUser();
    stmt.run(id);

    return true;
  }

  findByResetToken(token: string): User | null {
    const stmt = userQueries.getUserByResetToken();
    const row = stmt.get(token) as any | undefined;
    return row ? User.fromDatabase(row) : null;
  }

  setResetToken(userId: number, token: string, expiresAt: Date): void {
    const stmt = userQueries.setResetToken();
    stmt.run(token, expiresAt.toISOString(), userId);
  }

  clearResetToken(userId: number): void {
    const stmt = userQueries.clearResetToken();
    stmt.run(userId);
  }
}

export const userRepository = new UserRepository();
