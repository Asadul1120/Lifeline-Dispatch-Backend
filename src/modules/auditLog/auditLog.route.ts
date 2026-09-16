import express from "express";
import { AuditLogController } from "./auditLog.controller.js";
import Auth from "../../middleware/Auth.ts";

const router = express.Router();




router.get("/", Auth("ADMIN"), AuditLogController.getAllAuditLogs);

router.get(
  "/user/:userId",
  Auth("ADMIN"),
  AuditLogController.getAuditLogsByUser,
);

export const auditLogRoutes = router;
