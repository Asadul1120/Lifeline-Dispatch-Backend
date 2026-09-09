import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest.ts";
import { driverApplyValidation, driverVerifyEmailValidation } from "./driver.validation.ts";
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


export const driverRoutes = router;