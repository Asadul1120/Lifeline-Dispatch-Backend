import express from "express";

import Auth from "../../middleware/Auth.ts";
import { Role } from "../../generated/prisma/enums.ts";
import { AuditLogController } from "./auditLog.controller.js";

const router = express.Router();

router.get(
  "/",
  Auth(Role.ADMIN),
  AuditLogController.getAllAuditLogs,
);

router.get(
  "/user/:userId",
  Auth(Role.ADMIN),
  AuditLogController.getAuditLogsByUser,
);

export const auditLogRoutes = router;