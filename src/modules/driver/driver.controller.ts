import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { DriverService } from "./driver.service.js";

const applyDriver = catchAsync(async (req: Request, res: Response) => {
  await DriverService.applyDriver(req.body);

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "please verify your email with the OTP sent to your email address",
    data: null,
  });
});

const VerifyDriver = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const result = await DriverService.VerifyDriver(payload);

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Driver Apply submitted successfully",
    data: result,
  });
});

export const DriverController = {
  applyDriver,
  VerifyDriver,
};
