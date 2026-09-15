import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import Auth from "../../middleware/Auth.js";
import { Role } from "../../generated/prisma/enums.js";
import { assignAmbulanceValidation } from "./admin.validation.ts";
import { validateRequest } from "../../middleware/validateRequest.ts";
const router = Router();

// Get all pending driver applications

router.get(
  "/drivers/pending",
  Auth(Role.ADMIN),
  AdminController.getPendingDrivers,
);

router.patch(
  "/drivers/approve/:driverId",
  Auth(Role.ADMIN),
  AdminController.approveDriver,
);

router.patch(
  "/drivers/reject/:driverId",
  Auth(Role.ADMIN),
  AdminController.rejectDriver,
);

router.patch(
  "/emergency-requests/assign/:requestId",
  Auth(Role.ADMIN),
  validateRequest(assignAmbulanceValidation),
  AdminController.assignAmbulance,
);

export const adminRoutes = router;
