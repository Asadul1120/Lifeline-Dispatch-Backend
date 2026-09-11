import { Router } from "express";
import { EmergencyRequestController } from "./emergencyRequest.controller.ts";
import { validateRequest } from "../../middleware/validateRequest.ts";
import { createEmergencyRequestValidation } from "./emergencyRequest.validation.ts";
import { Role } from "../../generated/prisma/enums.ts";
import Auth from "../../middleware/Auth.ts";
const router = Router();

router.post(
  "/create",
  Auth(Role.PATIENT),
  validateRequest(createEmergencyRequestValidation),
  EmergencyRequestController.createEmergencyRequest,
);

router.get(
  "/my",
  Auth(Role.PATIENT),
  EmergencyRequestController.getMyEmergencyRequests,
);

router.get(
  "/:id",
  Auth(Role.PATIENT),
  EmergencyRequestController.getEmergencyRequestById,
);

router.patch(
  "/cancel/:id",
  Auth(Role.PATIENT),
  EmergencyRequestController.cancelEmergencyRequest,
);

export const emergencyRequestRoutes = router;
