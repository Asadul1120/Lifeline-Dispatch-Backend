import express from "express";
import { paymentController } from "./payment.controller.ts";
import { validateRequest } from "../../middleware/validateRequest.ts";
import { createPaymentValidationSchema } from "./payment.validation.ts";
import Auth from "../../middleware/Auth.ts";

const router = express.Router();

router.post(
  "/create",
  Auth("PATIENT"),
  validateRequest(createPaymentValidationSchema),
  paymentController.createPayment,
);

router.get("/my", Auth("PATIENT"), paymentController.getMyPayments);

router.get("/:paymentId", Auth("PATIENT"), paymentController.getPaymentById);

router.get("/bkash/callback", paymentController.paymentCallback);

export const paymentRoutes = router;
