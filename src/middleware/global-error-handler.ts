import type { NextFunction, Request, Response } from "express";

interface HttpError extends Error {
  statusCode?: number;
}

export function globalErrorHandler(
  error: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = error.statusCode ?? 500;
  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error",
  });
}
