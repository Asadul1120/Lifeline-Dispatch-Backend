import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync.js";
import { AdminService } from "./admin.service.js";
import { apiResponse } from "../../utils/apiResponse.ts";

const getPendingDrivers = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminService.getPendingDrivers();
  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Pending driver applications retrieved successfully.",
    data: result,
  });
});

const approveDriver = catchAsync(async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const adminId = req.user?.id;
  const result = await AdminService.approveDriver(
    driverId as string,
    adminId as string,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Driver approved successfully.",
    data: result,
  });
});

const rejectDriver = catchAsync(async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const adminId = req.user?.id;
  const result = await AdminService.rejectDriver(
    driverId as string,
    adminId as string,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Driver rejected successfully.",
    data: result,
  });
});

export const AdminController = {
  getPendingDrivers,
  approveDriver,
  rejectDriver,
};
