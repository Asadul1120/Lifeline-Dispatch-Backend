import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { apiResponse } from "../../utils/apiResponse.ts";
import { EmergencyRequestService } from "./emergencyRequest.service.js";

const createEmergencyRequest = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const result = await EmergencyRequestService.createEmergencyRequest(
      userId as string,
      req.body,
    );

    apiResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Emergency request created successfully.",
      data: result,
    });
  },
);

const getMyEmergencyRequests = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.user?.id;

    const result = await EmergencyRequestService.getMyEmergencyRequests(
      userId as string,
    );

    apiResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Emergency requests retrieved successfully.",
      data: result,
    });
  },
);

const getEmergencyRequestById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await EmergencyRequestService.getEmergencyRequestById(
      userId as string,
      id as string,
    );

    apiResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Emergency request retrieved successfully.",
      data: result,
    });
  },
);

const cancelEmergencyRequest = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = req.user?.id;

    const result = await EmergencyRequestService.cancelEmergencyRequest(
      userId as string,
      id as string,
    );

    apiResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Emergency request cancelled successfully.",
      data: result,
    });
  },
);

export const EmergencyRequestController = {
  createEmergencyRequest,
  getMyEmergencyRequests,
  getEmergencyRequestById,
  cancelEmergencyRequest,
};
