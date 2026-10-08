import httpStatus from "http-status-codes";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";

import {
  AmbulanceStatus,
  RequestStatus,
  Role,
  TripStatus,
} from "../../generated/prisma/enums.ts";
import { AuditLogService } from "../auditLog/auditLog.service.ts";

const startTrip = async (driverUserId: string, requestId: string) => {
  const result = await prisma.$transaction(
    async (tx) => {
      const request = await tx.emergencyRequest.findUnique({
        where: {
          id: requestId,
        },
        include: {
          ambulance: {
            include: {
              driver: {
                include: {
                  user: true,
                },
              },
            },
          },
          trip: true,
        },
      });

      if (!request) {
        throw new AppError(httpStatus.NOT_FOUND, "Emergency request not found");
      }

      if (!request.ambulance) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "No ambulance has been assigned to this request",
        );
      }

      if (!request.trip && request.status !== RequestStatus.ASSIGNED) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Only assigned requests can start a trip",
        );
      }

      if (request.trip) {
        throw new AppError(
          httpStatus.CONFLICT,
          "Trip already exists for this request",
        );
      }

      const driver = request.ambulance.driver;

      if (!driver) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "No driver is assigned to this ambulance",
        );
      }

      if (driver.userId !== driverUserId) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "You are not assigned to this ambulance",
        );
      }

      if (driver.user.role !== Role.DRIVER) {
        throw new AppError(
          httpStatus.FORBIDDEN,
          "Only drivers can start a trip",
        );
      }

      const trip = await tx.trip.create({
        data: {
          requestId: request.id,
          driverId: driver.id,
          startTime: new Date(),
          status: TripStatus.STARTED,
        },
        include: {
          request: true,
          driver: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
        },
      });

      await tx.emergencyRequest.update({
        where: {
          id: request.id,
        },
        data: {
          status: RequestStatus.ON_THE_WAY,
        },
      });

      return trip;
    },
    {
      timeout: 10000,
    },
  );

  await AuditLogService.createAuditLog({
    userId: driverUserId,
    action: "START_TRIP",
    entity: "TRIP",
    entityId: result.id,
  });

  return result;
};

const updateTripStatus = async (
  driverUserId: string,
  tripId: string,
  status: TripStatus,
  cancelReason?: string,
) => {
  const result = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: {
        id: tripId,
      },
      include: {
        driver: true,
        request: {
          include: {
            ambulance: true,
          },
        },
      },
    });

    if (!trip) {
      throw new AppError(httpStatus.NOT_FOUND, "Trip not found");
    }

    if (trip.driver.userId !== driverUserId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not allowed to update this trip",
      );
    }

    if (trip.status === TripStatus.COMPLETED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Completed trip cannot be updated",
      );
    }

    if (trip.status === TripStatus.CANCELLED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Cancelled trip cannot be updated",
      );
    }

    if (status === TripStatus.ONGOING && trip.status !== TripStatus.STARTED) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Only a started trip can be marked on the way",
      );
    }

    if (status === TripStatus.COMPLETED && trip.status !== TripStatus.ONGOING) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Trip must be on the way before it can be completed",
      );
    }

    if (status === TripStatus.CANCELLED) {
      if (!cancelReason?.trim()) {
        throw new AppError(
          httpStatus.BAD_REQUEST,
          "Cancellation reason is required",
        );
      }

      const cancelledTrip = await tx.trip.update({
        where: { id: tripId },
        data: {
          status: TripStatus.CANCELLED,
          cancelReason: cancelReason.trim(),
          endTime: new Date(),
        },
      });

      await tx.emergencyRequest.update({
        where: { id: trip.requestId },
        data: { status: RequestStatus.CANCELLED },
      });

      if (trip.request.ambulance) {
        await tx.ambulance.update({
          where: { id: trip.request.ambulance.id },
          data: { status: AmbulanceStatus.AVAILABLE },
        });
      }

      await tx.driver.update({
        where: { id: trip.driverId },
        data: { isAvailable: true },
      });

      await AuditLogService.createAuditLog({
        userId: driverUserId,
        action: "CANCEL_TRIP",
        entity: "TRIP",
        entityId: tripId,
      });

      return cancelledTrip;
    }

    if (status === TripStatus.COMPLETED) {
      const updatedTrip = await tx.trip.update({
        where: {
          id: tripId,
        },
        data: {
          status: TripStatus.COMPLETED,
          endTime: new Date(),
        },
      });

      await tx.emergencyRequest.update({
        where: {
          id: trip.requestId,
        },
        data: {
          status: RequestStatus.COMPLETED,
        },
      });

      if (trip.request.ambulance) {
        await tx.ambulance.update({
          where: {
            id: trip.request.ambulance.id,
          },
          data: {
            status: AmbulanceStatus.AVAILABLE,
          },
        });
      }

      await tx.driver.update({
        where: {
          id: trip.driverId,
        },
        data: {
          isAvailable: true,
        },
      });

      await AuditLogService.createAuditLog({
        userId: driverUserId,
        action: "UPDATE_TRIP_STATUS_COMPLETED",
        entity: "TRIP",
        entityId: tripId,
      });

      return updatedTrip;
    }

    const updatedTrip = await tx.trip.update({
      where: {
        id: tripId,
      },
      data: {
        status,
      },
    });

    await AuditLogService.createAuditLog({
      userId: driverUserId,
      action: `UPDATE_TRIP_STATUS_${status}`,
      entity: "TRIP",
      entityId: tripId,
    });

    return updatedTrip;
  });

  return result;
};

const markTripOnTheWay = (driverUserId: string, tripId: string) =>
  updateTripStatus(driverUserId, tripId, TripStatus.ONGOING);

const completeTrip = (driverUserId: string, tripId: string) =>
  updateTripStatus(driverUserId, tripId, TripStatus.COMPLETED);

const markTripPickedUp = async (driverUserId: string, tripId: string) => {
  const result = await prisma.$transaction(async (tx) => {
    const trip = await tx.trip.findUnique({
      where: { id: tripId },
      include: { driver: true, request: true },
    });

    if (!trip) throw new AppError(httpStatus.NOT_FOUND, "Trip not found");
    if (trip.driver.userId !== driverUserId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not allowed to update this trip",
      );
    }
    if (trip.status !== TripStatus.ONGOING) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Trip must be on the way before pickup",
      );
    }
    if (trip.request.status !== RequestStatus.ON_THE_WAY) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Request is not ready for pickup",
      );
    }

    await tx.emergencyRequest.update({
      where: { id: trip.requestId },
      data: { status: RequestStatus.PICKED_UP },
    });

    return tx.trip.findUnique({
      where: { id: tripId },
      include: { request: true },
    });
  });

  await AuditLogService.createAuditLog({
    userId: driverUserId,
    action: "PICKUP_PATIENT",
    entity: "TRIP",
    entityId: tripId,
  });

  return result;
};

const getMyTrips = async (driverUserId: string) => {
  const driver = await prisma.driver.findUnique({
    where: {
      userId: driverUserId,
    },
  });

  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver profile not found");
  }

  return await prisma.trip.findMany({
    where: {
      driverId: driver.id,
    },
    include: {
      request: {
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              patient: { select: { phone: true } },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getTripById = async (userId: string, tripId: string) => {
  const trip = await prisma.trip.findUnique({
    where: {
      id: tripId,
    },
    include: {
      driver: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      request: {
        include: {
          patient: {
            select: {
              id: true,
              name: true,
              email: true,
              patient: { select: { phone: true } },
            },
          },
          ambulance: true,
        },
      },
    },
  });

  if (!trip) {
    throw new AppError(httpStatus.NOT_FOUND, "Trip not found");
  }

  if (trip.driver.userId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not allowed to view this trip",
    );
  }

  return trip;
};

export const TripService = {
  startTrip,
  updateTripStatus,
  markTripOnTheWay,
  markTripPickedUp,
  completeTrip,
  getMyTrips,
  getTripById,
};
