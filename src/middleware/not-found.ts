import type { NextFunction, Request, Response } from "express";

export function notFound(req: Request, _res: Response, next: NextFunction): void {
  const error = Object.assign(new Error(`Route not found: ${req.originalUrl}`), {
    statusCode: 404,
  });
  next(error);
}
