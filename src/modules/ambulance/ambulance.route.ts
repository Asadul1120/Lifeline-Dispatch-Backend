import { Router } from "express";
import Auth from "../../middleware/Auth.ts";
import { validateRequest } from "../../middleware/validateRequest.ts";
import { Role } from "../../generated/prisma/enums.ts";
import { AmbulanceController } from "./ambulance.controller.ts";

import {
  createAmbulanceValidation,
  updateAmbulanceValidation,
  updateAmbulanceStatusValidation,
} from "./ambulance.validation.ts";

const router = Router();

router.post(
  "/create",
  Auth(Role.ADMIN),
  validateRequest(createAmbulanceValidation),
  AmbulanceController.createAmbulance,
);

router.get("/", Auth(Role.ADMIN), AmbulanceController.getAllAmbulances);

router.get("/:id", Auth(Role.ADMIN), AmbulanceController.getAmbulanceById);

router.patch(
  "/:id",
  Auth(Role.ADMIN),
  validateRequest(updateAmbulanceValidation),
  AmbulanceController.updateAmbulance,
);

router.patch(
  "/status/:id",
  Auth(Role.ADMIN),
  validateRequest(updateAmbulanceStatusValidation),
  AmbulanceController.updateAmbulanceStatus,
);

export const ambulanceRoutes = router;
