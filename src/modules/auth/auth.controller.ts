import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { apiResponse } from "../../utils/apiResponse.ts";
import { catchAsync } from "../../utils/catchAsync.js";

import { authService } from "./auth.service.ts";

const RegisterUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  await authService.RegisterUser(payload);

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "please verify your email with the OTP sent to your email address",
    data: null,
  });
});

const VerifyUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const { user, accessToken, refreshToken } =
    await authService.VerifyUser(payload);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "User Registered successfully",
    data: {
      user,
      accessToken,
      refreshToken,
    },
  });
});

const LoginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const { accessToken, refreshToken } = await authService.LoginUser(payload);

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Logged in successfully",
    data: {
      accessToken,
      refreshToken,
    },
  });
});

const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  const result = await authService.refreshToken(refreshToken);

  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Token Generated successfully",
    data: result,
  });
});

const googleLogin = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await authService.googleLogin(payload);

  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24,
  });

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7,
  });

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Logged in successfully",
    data: result,
  });
});

const logoutUser = catchAsync(async (req: Request, res: Response) => {
  await authService.logoutUser();

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Logged out successfully",
    data: null,
  });
});

export const authController = {
  RegisterUser,
  VerifyUser,
  LoginUser,
  refreshToken,
  googleLogin,
  logoutUser,
};
