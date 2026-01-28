import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Response, NextFunction } from "express";
import { JWT_SECRET } from "../shared/middleware/auth";
import { AuthenticatedRequest, LoginRequest, JWTPayload } from "../shared/types";
import { translate, DEFAULT_LANGUAGE } from "../shared/services/i18n";
import { getUserPermissions } from "../permissions/service";
import { comparePasswordSync, hashPasswordSync } from "../shared/utils/password";
import { userRepository } from "../users/repository";
import { sendPasswordResetEmail } from "../shared/services/email";

const authController = {
  async login(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body as LoginRequest;

      const user = userRepository.findByEmail(email);

      const userLanguage = user?.language || DEFAULT_LANGUAGE;
      const t = (key: string) => translate(userLanguage, key);

      if (!user || !user.password) {
        res.status(401).json({ 
          error: t("errors.invalid_credentials")
        });
        return;
      }

      const isPasswordValid = comparePasswordSync(password, user.password);
      
      if (!isPasswordValid) {
        res.status(401).json({ 
          error: t("errors.invalid_credentials")
        });
        return;
      }

      const payload: JWTPayload = {
        userId: user.id,
        email: user.email,
        type: user.type,
        language: userLanguage
      };

      const token = jwt.sign(payload, JWT_SECRET, {
        expiresIn: "24h"
      });

      const userPermissions = getUserPermissions(user.id);

      res.status(200).json({
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          type: user.type,
          language: userLanguage,
          permissions: userPermissions
        }
      });
    } catch (error) {
      next(error);
    }
  },

  async requestPasswordReset(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email } = req.body as { email: string };
      const language = req.language || DEFAULT_LANGUAGE;
      const t = (key: string) => translate(language, key);

      const user = userRepository.findByEmail(email);

      if (!user) {
        res.status(200).json({
          message: t("auth.password_reset.email_sent")
        });
        return;
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      userRepository.setResetToken(user.id, resetToken, expiresAt);

      try {
        await sendPasswordResetEmail(
          {
            name: user.name,
            email: user.email,
            language: user.language || language
          },
          resetToken
        );
      } catch (error) {
      }

      res.status(200).json({
        message: t("auth.password_reset.email_sent")
      });
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, password } = req.body as { token: string; password: string };
      const language = req.language || DEFAULT_LANGUAGE;
      const t = (key: string) => translate(language, key);

      const user = userRepository.findByResetToken(token);

      if (!user) {
        res.status(400).json({
          error: t("auth.password_reset.invalid_token")
        });
        return;
      }

      const hashedPassword = hashPasswordSync(password);
      userRepository.update(user.id, { password: hashedPassword });
      userRepository.clearResetToken(user.id);

      res.status(200).json({
        message: t("auth.password_reset.success")
      });
    } catch (error) {
      next(error);
    }
  }
};

export default authController;
