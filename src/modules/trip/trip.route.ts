import { Router } from "express";
import Auth from "../../middleware/Auth.ts";
import { Role } from "../../generated/prisma/enums.ts";
import { validateRequest } from "../../middleware/validateRequest.ts";
import { TripController } from "./trip.controller.ts";
import {
  cancelTripValidation,
  updateTripStatusValidation,
} from "./trip.validation.ts";

const router = Router();

router.post("/start/:requestId", Auth(Role.DRIVER), TripController.startTrip);

router.patch(
  "/on-the-way/:tripId",
  Auth(Role.DRIVER),
  TripController.markTripOnTheWay,
);

router.patch(
  "/complete/:tripId",
  Auth(Role.DRIVER),
  TripController.completeTrip,
);

router.patch(
  "/picked-up/:tripId",
  Auth(Role.DRIVER),
  TripController.markTripPickedUp,
);

router.patch(
  "/cancel/:tripId",
  Auth(Role.DRIVER),
  validateRequest(cancelTripValidation),
  TripController.cancelTrip,
);

router.patch(
  "/status/:tripId",
  Auth(Role.DRIVER),
  validateRequest(updateTripStatusValidation),
  TripController.updateTripStatus,
);

router.get("/my", Auth(Role.DRIVER), TripController.getMyTrips);

router.get("/:tripId", Auth(Role.DRIVER), TripController.getTripById);

export const tripRoutes = router;
