import { Router } from "express";
import { authController } from "./auth.controller.ts";
import { validateRequest } from "../../middleware/validateRequest.ts";
import {
  registerValidation,
  verifyEmailValidation,
} from "./auth.validation.ts";

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

export const authRoutes = router;
