import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { apiResponse } from "../../utils/apiResponse.ts";
import { AdminService } from "./admin.service.js";

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

const assignAmbulance = catchAsync(async (req: Request, res: Response) => {
  const { requestId } = req.params;
  const { ambulanceId } = req.body;
  const adminId = req.user?.id;

  const result = await AdminService.assignAmbulance(
    requestId as string,
    ambulanceId,
    adminId as string,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ambulance assigned successfully",
    data: result,
  });
});

const getAllEmergencyRequests = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AdminService.getAllEmergencyRequests(
      req.query as {
        page?: string;
        limit?: string;
        status?: string;
        priority?: string;
        emergencyType?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
      },
    );

    apiResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Emergency requests retrieved successfully.",
      data: result,
    });
  },
);

const getEmergencyRequestByIdForAdmin = catchAsync(
  async (req: Request, res: Response) => {
    const { requestId } = req.params;

    const result = await AdminService.getEmergencyRequestByIdForAdmin(
      requestId as string,
    );

    apiResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Emergency request retrieved successfully.",
      data: result,
    });
  },
);

export const AdminController = {
  getPendingDrivers,
  approveDriver,
  rejectDriver,
  assignAmbulance,
  getAllEmergencyRequests,
  getEmergencyRequestByIdForAdmin,
};
