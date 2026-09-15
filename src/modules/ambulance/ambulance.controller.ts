import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { AmbulanceService } from "./ambulance.service.js";

const createAmbulance = catchAsync(async (req: Request, res: Response) => {
  const result = await AmbulanceService.createAmbulance(req.body);

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Ambulance created successfully",
    data: result,
  });
});

const getAllAmbulances = catchAsync(async (req: Request, res: Response) => {
  const result = await AmbulanceService.getAllAmbulances();

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ambulances retrieved successfully",
    data: result,
  });
});

const getAmbulanceById = catchAsync(async (req: Request, res: Response) => {
  const result = await AmbulanceService.getAmbulanceById(
    req.params.id as string,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ambulance retrieved successfully",
    data: result,
  });
});

const updateAmbulance = catchAsync(async (req: Request, res: Response) => {
  const result = await AmbulanceService.updateAmbulance(
    req.params.id as string,
    req.body,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Ambulance updated successfully",
    data: result,
  });
});

const updateAmbulanceStatus = catchAsync(
  async (req: Request, res: Response) => {
    const result = await AmbulanceService.updateAmbulanceStatus(
      req.params.id as string,
      req.body,
    );

    apiResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Ambulance status updated successfully",
      data: result,
    });
  },
);

export const AmbulanceController = {
  createAmbulance,
  getAllAmbulances,
  getAmbulanceById,
  updateAmbulance,
  updateAmbulanceStatus,
};
