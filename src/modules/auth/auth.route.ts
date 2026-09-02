import { Router } from "express";
import { authController } from "./auth.controller.ts";

const router = Router();

router.post("/register", authController.RegisterUser);

router.post("/verify-email", authController.VerifyUser);





export const authRoutes = router;