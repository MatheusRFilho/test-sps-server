import { runMigrations, rollbackLastMigration, listMigrations } from "../shared/database/migrator";
import db from "../shared/database/database";

const command = process.argv[2] || "run";

switch (command) {
  case "run":
    runMigrations(db);
    break;

  case "rollback":
    rollbackLastMigration(db);
    break;

  case "status":
    listMigrations(db);
    break;

  default:
    process.exit(1);
}
