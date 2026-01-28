import express, { Express } from "express";
import routes from "../../src/routes";
import { errorHandler, notFoundHandler } from "../../src/shared/middleware/errorHandler";
import { i18nMiddleware } from "../../src/shared/services/i18n";
import cors from "cors";

export function createTestApp(): Express {
  const app = express();
  app.use(express.json());
  app.use(cors());
  app.use(i18nMiddleware);
  app.use(routes);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
