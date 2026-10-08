import { Request, Response } from "express";
import httpStatus from "http-status-codes";
import { catchAsync } from "../../utils/catchAsync.js";
import { apiResponse } from "../../utils/apiResponse.ts";
import { TripService } from "./trip.service.js";

const startTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.startTrip(
    req.user?.id as string,
    req.params.requestId as string,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.CREATED,
    message: "Trip started successfully.",
    data: result,
  });
});

const updateTripStatus = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.updateTripStatus(
    req.user?.id as string,
    req.params.tripId as string,
    req.body.status,
    req.body.reason,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Trip status updated successfully.",
    data: result,
  });
});

const markTripOnTheWay = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.markTripOnTheWay(
    req.user?.id as string,
    req.params.tripId as string,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Trip marked as on the way successfully.",
    data: result,
  });
});

const markTripPickedUp = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.markTripPickedUp(
    req.user?.id as string,
    req.params.tripId as string,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Patient pickup marked successfully.",
    data: result,
  });
});

const completeTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.completeTrip(
    req.user?.id as string,
    req.params.tripId as string,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Trip completed successfully.",
    data: result,
  });
});

const cancelTrip = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.updateTripStatus(
    req.user?.id as string,
    req.params.tripId as string,
    "CANCELLED",
    req.body.reason,
  );

  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Trip cancelled successfully.",
    data: result,
  });
});

const getMyTrips = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.getMyTrips(req.user?.id as string);
  apiResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Trips retrieved successfully.",
    data: result,
  });
});

const getTripById = catchAsync(async (req: Request, res: Response) => {
  const result = await TripService.getTripById(
    req.user?.id as string,
    req.params.tripId as string,
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
  markTripOnTheWay,
  markTripPickedUp,
  completeTrip,
  cancelTrip,
  getMyTrips,
  getTripById,
};
