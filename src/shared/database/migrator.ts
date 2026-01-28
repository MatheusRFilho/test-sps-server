import * as fs from "fs";
import * as path from "path";
import { Database as DatabaseType } from "better-sqlite3";

interface Migration {
  name: string;
  up: (db: DatabaseType) => void;
  down: (db: DatabaseType) => void;
}

interface MigrationRecord {
  name: string;
  executed_at: string;
}

function createMigrationsTable(db: DatabaseType): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      name TEXT PRIMARY KEY,
      executed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

function getExecutedMigrations(db: DatabaseType): string[] {
  const stmt = db.prepare("SELECT name FROM migrations ORDER BY name");
  const migrations = stmt.all() as MigrationRecord[];
  return migrations.map((m) => m.name);
}

function loadMigrations(): Migration[] {
  let migrationsDir: string;
  
  if (__filename.endsWith('.js')) {
    migrationsDir = path.join(__dirname, "migrations");
  } else {
    migrationsDir = path.join(__dirname, "migrations");
  }
  
  if (!fs.existsSync(migrationsDir)) {
    return [];
  }
  
  const files = fs.readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .sort();

  const migrations: Migration[] = [];

  for (const file of files) {
    try {
      const migrationPath = path.join(migrationsDir, file);
      
      if (!fs.existsSync(migrationPath)) {
        continue;
      }
      
      delete require.cache[require.resolve(migrationPath)];
      const migration = require(migrationPath);
      
      if (migration && migration.up && migration.down) {
        migrations.push({
          name: file.replace(".ts", ""),
          up: migration.up,
          down: migration.down,
        });
      } 
    } catch (error: any) {
      continue;
    }
  }

  return migrations;
}

function runMigration(db: DatabaseType, migration: Migration): void {
  const transaction = db.transaction(() => {
    migration.up(db);
    
    const insertMigration = db.prepare(`
      INSERT OR IGNORE INTO migrations (name)
      VALUES (?)
    `);
    insertMigration.run(migration.name);
  });

  transaction();
}

function rollbackMigration(db: DatabaseType, migration: Migration): void {
  const transaction = db.transaction(() => {
    migration.down(db);
    
    const deleteMigration = db.prepare("DELETE FROM migrations WHERE name = ?");
    deleteMigration.run(migration.name);
  });

  transaction();
}

export function runMigrations(db: DatabaseType): void {
  try {
    if (!db || typeof db.exec !== 'function') {
      return;
    }

    createMigrationsTable(db);
    const executedMigrations = getExecutedMigrations(db);
    const allMigrations = loadMigrations();
    
    const pendingMigrations = allMigrations.filter(
      (migration) => !executedMigrations.includes(migration.name)
    );

    if (pendingMigrations.length === 0) {
      return;
    }

    for (const migration of pendingMigrations) {
      try {
        if (!migration.up || !migration.down) {
          continue;
        }
        runMigration(db, migration);
      } catch (error: any) {
        throw error;
      }
    }

  } catch (error: any) {
    throw error;
  }
}

export function rollbackLastMigration(db: DatabaseType): void {
  createMigrationsTable(db);
  const executedMigrations = getExecutedMigrations(db);
  
  if (executedMigrations.length === 0) {
    return;
  }

  const lastMigrationName = executedMigrations[executedMigrations.length - 1];
  const allMigrations = loadMigrations();
  const migration = allMigrations.find((m) => m.name === lastMigrationName);

  if (!migration) {
    return;
  }

  try {
    rollbackMigration(db, migration);
  } catch (error: any) {
    throw error;
  }
}

export function listMigrations(db: DatabaseType): void {
  createMigrationsTable(db);
  const executedMigrations = getExecutedMigrations(db);
  const allMigrations = loadMigrations();

  for (const migration of allMigrations) {
     executedMigrations.includes(migration.name);
  }
}
