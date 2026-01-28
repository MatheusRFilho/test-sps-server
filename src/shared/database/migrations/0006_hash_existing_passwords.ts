import { Database as DatabaseType } from "better-sqlite3";
import bcrypt from "bcrypt";

export const up = (db: DatabaseType): void => {
  
  const getAllUsers = db.prepare("SELECT id, password FROM users");
  const updatePassword = db.prepare("UPDATE users SET password = ? WHERE id = ?");
  
  const users = getAllUsers.all() as Array<{ id: number; password: string }>;
  
  let updatedCount = 0;
  
  for (const user of users) {
    const password = user.password;
    
    if (!password.startsWith("$2a$") && !password.startsWith("$2b$") && !password.startsWith("$2y$")) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      updatePassword.run(hashedPassword, user.id);
      updatedCount++;
    }
  }
};

export const down = (_db: DatabaseType): void => {
  throw new Error("Não é possível reverter o hash de senhas. As senhas permanecerão hasheadas.");
};
