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
    message: "please verify your email with the OTP sent to your email address",
    data: null,
  });
};

const VerifyUser = async (req: Request, res: Response) => {
  const payload = req.body;
  const { user, accessToken, refreshToken } =
    await authService.VerifyUser(payload);

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

const LoginUser = async (req: Request, res: Response) => {
  const payload = req.body;
  const { accessToken, refreshToken } = await authService.LoginUser(payload);

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
    statusCode: httpStatus.OK,
    message: "User Logged in successfully",
    data: { accessToken, refreshToken },
  });
};

const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  const result = await authService.refreshToken(refreshToken);

  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, //  7 day
  });

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Token Generated successfully",
    data: result,
  });
};

const googleLogin = async (req: Request, res: Response) => {
  const Payload = req.body;
  const result = await authService.googleLogin(Payload);

  res.cookie("accessToken", result.accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });

  res.cookie("refreshToken", result.refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, //  7 day
  });

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "User Logged in successfully",
    data: result,
  });
};

const test = async (req: Request, res: Response) => {
  const user = req.user;
  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "You have access to this route",
    data: { user },
  });
};

export const authController = {
  RegisterUser,
  VerifyUser,
  LoginUser,
  refreshToken,
  googleLogin,
  test,
};
