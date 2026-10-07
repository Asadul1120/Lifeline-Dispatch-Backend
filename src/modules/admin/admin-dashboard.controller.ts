import { Request, Response } from "express";
import httpStatus from "http-status-codes";

import { catchAsync } from "../../utils/catchAsync.ts";
import { apiResponse } from "../../utils/apiResponse.ts";
import { AdminDashboardService } from "./admin-dashboard.service.ts";

const getSummary = catchAsync(async (_req: Request, res: Response) => {
  const result = await AdminDashboardService.getSummary();

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Admin dashboard summary retrieved.",
    data: result,
  });
});

export const AdminDashboardController = {
  getSummary,
};