import express from "express";

import { paymentController } from "./payment.controller.ts";
import { createPaymentValidationSchema } from "./payment.validation.ts";

import { validateRequest } from "../../middleware/validateRequest.ts";
import Auth from "../../middleware/Auth.ts";
import { Role } from "../../generated/prisma/enums.ts";

const router = express.Router();

router.post(
  "/create",
  Auth(Role.PATIENT),
  validateRequest(createPaymentValidationSchema),
  paymentController.createPayment,
);

router.get("/my", Auth(Role.PATIENT), paymentController.getMyPayments);

router.get("/bkash/callback", paymentController.paymentCallback);

router.get("/:paymentId", Auth(Role.PATIENT), paymentController.getPaymentById);

export const paymentRoutes = router;
