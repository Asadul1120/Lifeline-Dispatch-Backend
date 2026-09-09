import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { apiResponse } from "../../utils/apiResponse.js";
import { UserService } from "./user.service.js";

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
  const ImageBuffer = req.file?.buffer;
  // const payload = JSON.parse(req.body.data);
  const payload = req.body;

  const result = await UserService.updateMe(userId, payload, ImageBuffer);

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
