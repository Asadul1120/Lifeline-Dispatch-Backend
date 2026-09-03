import type { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError.ts";

interface HttpError extends Error {
  statusCode?: number;
}

export function globalErrorHandler(
  error: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {

  let statusCode = 500;
  let message = "Internal server error";

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  } else {
    statusCode = error.statusCode ?? 500;
    message = error.message || message;
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === "development" && {
      stack: error.stack,
    }),
  });
}