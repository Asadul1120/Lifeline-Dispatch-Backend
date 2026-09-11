import httpStatus from "http-status-codes";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { RequestStatus, Role } from "../../generated/prisma/enums.ts";

import { ICreateEmergencyRequest } from "./emergencyRequest.interface.ts";

const createEmergencyRequest = async (
  userId: string,
  payload: ICreateEmergencyRequest,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role !== Role.PATIENT) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only patient can create emergency request",
    );
  }

  const emergencyRequest = await prisma.emergencyRequest.create({
    data: {
      patientId: user.id,
      pickupLocation: payload.pickupLocation,
      destination: payload.destination,
      emergencyType: payload.emergencyType,
      priority: payload.priority,
      status: RequestStatus.PENDING,
    },

    include: {
      patient: {
        omit: {
          password: true,
        },
      },
    },
  });

  return emergencyRequest;
};

const getMyEmergencyRequests = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  if (user.role !== Role.PATIENT) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only patient can view emergency requests",
    );
  }

  const emergencyRequests = await prisma.emergencyRequest.findMany({
    where: {
      patientId: userId,
    },

    include: {
      ambulance: {
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
        },
      },

      trip: true,
      payment: true,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return emergencyRequests;
};

const getEmergencyRequestById = async (userId: string, requestId: string) => {
  const emergencyRequest = await prisma.emergencyRequest.findUnique({
    where: {
      id: requestId,
    },

    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },

      ambulance: {
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
        },
      },

      trip: true,

      payment: true,
    },
  });

  if (!emergencyRequest) {
    throw new AppError(httpStatus.NOT_FOUND, "Emergency request not found");
  }

  if (emergencyRequest.patientId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not allowed to view this request",
    );
  }

  return emergencyRequest;
};

const cancelEmergencyRequest = async (userId: string, requestId: string) => {
  const emergencyRequest = await prisma.emergencyRequest.findUnique({
    where: {
      id: requestId,
    },
  });

  if (!emergencyRequest) {
    throw new AppError(httpStatus.NOT_FOUND, "Emergency request not found");
  }

  if (emergencyRequest.patientId !== userId) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "You are not allowed to cancel this request",
    );
  }

  if (emergencyRequest.status !== RequestStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only pending requests can be cancelled",
    );
  }

  const cancelledRequest = await prisma.emergencyRequest.update({
    where: {
      id: requestId,
    },

    data: {
      status: RequestStatus.CANCELLED,
    },

    include: {
      patient: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return cancelledRequest;
};

export const EmergencyRequestService = {
  createEmergencyRequest,
  getMyEmergencyRequests,
  getEmergencyRequestById,
  cancelEmergencyRequest,
};
