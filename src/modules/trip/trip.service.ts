import httpStatus from "http-status-codes";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";

import {
  AmbulanceStatus,
  RequestStatus,
  Role,
  TripStatus,
} from "../../generated/prisma/enums.ts";

const startTrip = async (driverUserId: string, requestId: string) => {
  const result = await prisma.$transaction(async (tx) => {
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

    if (driver.userId !== driverUserId) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "You are not assigned to this ambulance",
      );
    }

    if (driver.user.role !== Role.DRIVER) {
      throw new AppError(httpStatus.FORBIDDEN, "Only drivers can start a trip");
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
  });

  return result;
};

const updateTripStatus = async (
  driverUserId: string,
  tripId: string,
  status: TripStatus,
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

    return updatedTrip;
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
  getMyTrips,
  getTripById,
};
