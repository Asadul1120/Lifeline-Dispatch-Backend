import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync.js";
import { apiResponse } from "../../utils/apiResponse.ts";
import { AppError } from "../../utils/AppError.ts";

import { AuditLogService } from "./auditLog.service.js";
import { AuditLogValidation } from "./auditLog.validation.ts";

const getAllAuditLogs = catchAsync(async (req: Request, res: Response) => {
  const query = AuditLogValidation.auditLogQuerySchema.safeParse(req.query);

  if (!query.success) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      query.error.issues[0]?.message || "Invalid query",
    );
  }

  const result = await AuditLogService.getAllAuditLogs(query.data);

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Audit logs retrieved successfully.",
    data: result,
  });
});

const getAuditLogsByUser = catchAsync(async (req: Request, res: Response) => {
  const query = AuditLogValidation.auditLogQuerySchema.safeParse(req.query);

  if (!query.success) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      query.error.issues[0]?.message || "Invalid query",
    );
  }

  const result = await AuditLogService.getAuditLogsByUser(
    req.params.userId as string,
    query.data,
  );

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
