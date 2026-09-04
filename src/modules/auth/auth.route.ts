import { Router } from "express";
import { authController } from "./auth.controller.ts";
import { validateRequest } from "../../middleware/validateRequest.ts";
import {
  loginValidation,
  registerValidation,
  verifyEmailValidation,
} from "./auth.validation.ts";

import { Role } from "../../generated/prisma/enums.ts";
import Auth from "../../middleware/Auth.ts";

const router = Router();

router.post(
  "/register",
  validateRequest(registerValidation),
  authController.RegisterUser,
);

router.post(
  "/verify-email",
  validateRequest(verifyEmailValidation),
  authController.VerifyUser,
);

router.post(
  "/login",
  validateRequest(loginValidation),
  authController.LoginUser,
);

router.get(
  "/test",
  Auth(),
  authController.test,
);

router.post('/refresh-token', authController.refreshToken);
router.post('/google', authController.googleLogin);

export const authRoutes = router;
