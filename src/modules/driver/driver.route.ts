import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.ts";
import {
  driverApplyValidation,
  driverVerifyEmailValidation,
  updateDriverAvailabilityValidation,
  updateDriverLocationValidation,
} from "./driver.validation.ts";
import { DriverController } from "./driver.controller.ts";
import Auth from "../../middleware/Auth.ts";
import { Role } from "../../generated/prisma/enums.ts";

const router = Router();

router.post(
  "/apply",
  validateRequest(driverApplyValidation),
  DriverController.applyDriver,
);

router.post(
  "/driver-verify",
  validateRequest(driverVerifyEmailValidation),
  DriverController.VerifyDriver,
);

router.get(
  "/assigned-requests",
  Auth(Role.DRIVER),
  DriverController.getAssignedRequests,
);

router.patch(
  "/availability",
  Auth(Role.DRIVER),
  validateRequest(updateDriverAvailabilityValidation),
  DriverController.updateAvailability,
);

router.patch(
  "/location",
  Auth(Role.DRIVER),
  validateRequest(updateDriverLocationValidation),
  DriverController.updateLocation,
);

export const driverRoutes = router;
