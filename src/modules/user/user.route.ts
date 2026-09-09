import { Router } from "express";
import Auth from "../../middleware/Auth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import { userController } from "./user.controller.ts";
import { updateProfileValidation } from "./user.validation.ts";
import { upload } from "../../middleware/multer.ts";

const router = Router();

router.get("/me", Auth(), userController.getMe);

router.patch(
  "/me",
  Auth(),
  upload.single("profileImage"),   
  validateRequest(updateProfileValidation),
  userController.updateMe,
);

export const userRoutes = router;
