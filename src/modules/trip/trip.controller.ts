import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { apiResponse } from "../../utils/apiResponse.ts";
import { TripService } from "./trip.service.js";

const startTrip = catchAsync(async (req: Request, res: Response) => {
  const driverUserId = req.user?.id;
  const { requestId } = req.params;

  const result = await TripService.startTrip(
    driverUserId as string,
    requestId as string,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Trip started successfully.",
    data: result,
  });
});

const updateTripStatus = catchAsync(async (req: Request, res: Response) => {
  const driverUserId = req.user?.id;
  const { tripId } = req.params;

  const result = await TripService.updateTripStatus(
    driverUserId as string,
    tripId as string,
    req.body.status,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Trip status updated successfully.",
    data: result,
  });
});

const getMyTrips = catchAsync(async (req: Request, res: Response) => {
  const driverUserId = req.user?.id;

  const result = await TripService.getMyTrips(driverUserId as string);

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Trips retrieved successfully.",
    data: result,
  });
});

const getTripById = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { tripId } = req.params;

  const result = await TripService.getTripById(
    userId as string,
    tripId as string,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Trip retrieved successfully.",
    data: result,
  });
});

export const TripController = {
  startTrip,
  updateTripStatus,
  getMyTrips,
  getTripById,
};
