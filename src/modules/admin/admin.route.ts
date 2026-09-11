import { Router } from "express";
import { AdminController } from "./admin.controller.js";
import Auth from "../../middleware/Auth.js";
import { Role } from "../../generated/prisma/enums.js";
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

export const adminRoutes = router;
