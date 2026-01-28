import "dotenv/config";
import express, { Express, Request, Response, NextFunction } from "express";
import routes from "./routes";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./shared/config/swagger";
import { errorHandler, notFoundHandler } from "./shared/middleware/errorHandler";
import { i18nMiddleware } from "./shared/services/i18n";
import { translate, DEFAULT_LANGUAGE } from "./shared/services/i18n";

import "./shared/database/database";

const app: Express = express();

app.use(express.json());
app.use(cors());

app.use(i18nMiddleware);

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: ".swagger-ui .topbar { display: none }",
  customSiteTitle: "API Documentation"
}));

app.use(routes);

app.get("/docs", (_req, res) => {
  res.redirect("/api-docs");
});

app.use(notFoundHandler);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError && err.message.includes("JSON")) {
    const language = (req.headers["accept-language"]?.split(",")[0]?.split("-")[0] || DEFAULT_LANGUAGE) as "pt" | "en" | "es";
    const t = (key: string) => translate(language, key);
    
    res.status(400).json({
      error: t("errors.invalid_json"),
      message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
    return;
  }
  
  if (err.type === "entity.parse.failed") {
    const language = (req.headers["accept-language"]?.split(",")[0]?.split("-")[0] || DEFAULT_LANGUAGE) as "pt" | "en" | "es";
    const t = (key: string) => translate(language, key);
    
    res.status(400).json({
      error: t("errors.invalid_json"),
      message: process.env.NODE_ENV === "development" ? err.message : undefined
    });
    return;
  }
  
  next(err);
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
