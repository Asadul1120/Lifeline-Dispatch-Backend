import express from "express";
import { AuditLogController } from "./auditLog.controller.js";
import Auth from "../../middleware/Auth.ts";
import { Role } from "../../generated/prisma/enums.ts";
import { validateRequest } from "../../middleware/validateRequest.ts";
import { AuditLogValidation } from "./auditLog.validation.ts";

const router = express.Router();

router.get(
  "/",
  Auth(Role.ADMIN),
  validateRequest(AuditLogValidation.auditLogQuerySchema),
  AuditLogController.getAllAuditLogs,
);

router.get(
  "/user/:userId",
  Auth(Role.ADMIN),
  validateRequest(AuditLogValidation.auditLogQuerySchema),
  AuditLogController.getAuditLogsByUser,
);

export const auditLogRoutes = router;
