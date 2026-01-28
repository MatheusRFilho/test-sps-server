import { Router, Request, Response } from "express";
import authRoutes from "./auth/routes";
import userRoutes from "./users/routes";

const routes = Router();

routes.get("/", (_req: Request, res: Response) => {
  res.json({ 
    message: "API RESTful de Usuários",
    version: "1.0.0",
    endpoints: {
      auth: "/auth/login",
      users: "/users"
    }
  });
});

routes.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0"
  });
});

routes.use("/auth", authRoutes);

routes.use("/users", userRoutes);

export default routes;
