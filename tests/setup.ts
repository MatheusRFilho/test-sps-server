process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-secret-key";
process.env.FRONTEND_URL = "http://localhost:3000";

jest.mock("../src/shared/services/email", () => ({
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
}));

import { closeTestDb } from "./helpers/test-db";


afterAll(() => {
  closeTestDb();
});
