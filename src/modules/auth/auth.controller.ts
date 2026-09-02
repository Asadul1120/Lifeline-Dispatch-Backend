import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { apiResponse } from "../../utils/apiResponse.ts";
import { authService } from "./auth.service.ts";

const RegisterUser = async (req: Request, res: Response) => {
  const payload = req.body;
  await authService.RegisterUser(payload);
  apiResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message:
      "user created in redis successfully, please verify your email with the OTP sent to your email address",
    data: null,
  });
};

const VerifyUser = async (req: Request, res: Response) => {
  const payload = req.body;
  const { user, accessToken, refreshToken } = await authService.VerifyUser(
    payload.email,
    payload.otp,
  );

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User Registered successfully",
    data: { user, accessToken, refreshToken },
  });
};

export const authController = {
  RegisterUser,
  VerifyUser,
};
