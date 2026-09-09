import { Router } from "express";
import { authController } from "./auth.controller.ts";
import { validateRequest } from "../../middleware/validateRequest.ts";
import {
  googleLoginValidation,
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

router.post("/refresh-token", authController.refreshToken);
router.post(
  "/google",
  validateRequest(googleLoginValidation),
  authController.googleLogin,
);
router.post("/logout", authController.logoutUser);

export const authRoutes = router;
