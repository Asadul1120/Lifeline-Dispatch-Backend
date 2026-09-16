import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { UserService } from "./user.service.js";
import { IUpdateUserPayload } from "./user.interface.ts";
import { AppError } from "../../utils/AppError.ts";

const getMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const result = await UserService.getMe(userId);

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile retrieved successfully",
    data: result,
  });
});

const updateMe = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const imageBuffer = req.file?.buffer;
  const payload = req.body;

  const result = await UserService.updateMe(userId, payload, imageBuffer);
  
  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Profile updated successfully",
    data: result,
  });
});
export const userController = {
  getMe,
  updateMe,
};
