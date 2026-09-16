import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { apiResponse } from "../../utils/apiResponse.ts";
import { paymentService } from "./payment.service.ts";

const createPayment = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const result = await paymentService.createPayment(userId as string, req.body);

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Payment initialized successfully.",
    data: result,
  });
});

const paymentCallback = catchAsync(async (req: Request, res: Response) => {
  const result = await paymentService.paymentCallback(req.query as any);

  res.redirect(result.redirectUrl);
});

const getMyPayments = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const result = await paymentService.getMyPayments(userId as string);

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payments retrieved successfully.",
    data: result,
  });
});

const getPaymentById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  const { paymentId } = req.params;

  const result = await paymentService.getPaymentById(
    userId as string,
    paymentId as string,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Payment retrieved successfully.",
    data: result,
  });
});

export const paymentController = {
  createPayment,
  paymentCallback,
  getMyPayments,
  getPaymentById,
};
