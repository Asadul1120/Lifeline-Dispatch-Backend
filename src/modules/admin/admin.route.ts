import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import Auth from "../../middleware/Auth.js";
import { Role } from "../../generated/prisma/enums.js";
import { assignAmbulanceValidation } from "./admin.validation.ts";
import { validateRequest } from "../../middleware/validateRequest.ts";

const router = Router();

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

router.get(
  "/emergency-requests",
  Auth(Role.ADMIN),
  AdminController.getAllEmergencyRequests,
);

router.get(
  "/emergency-requests/:requestId",
  Auth(Role.ADMIN),
  AdminController.getEmergencyRequestByIdForAdmin,
);

router.get("/users", Auth(Role.ADMIN), AdminController.getAllUsers);

router.get(
  "/users/:userId",
  Auth(Role.ADMIN),
  AdminController.getUserByIdForAdmin,
);

router.patch(
  "/users/status/:userId",
  Auth(Role.ADMIN),
  AdminController.updateUserStatus,
);

export const adminRoutes = router;
