import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { apiResponse } from "../../utils/apiResponse.ts";
import { AuditLogService } from "./auditLog.service.js";

const getAllAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const result = await AuditLogService.getAllAuditLogs();

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Audit logs retrieved successfully.",
    data: result,
  });
});

const getAuditLogsByUser = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.params;

  const result = await AuditLogService.getAuditLogsByUser(userId as string);

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User audit logs retrieved successfully.",
    data: result,
  });
});

export const AuditLogController = {
  getAllAuditLogs,
  getAuditLogsByUser,
};
