import httpStatus from "http-status-codes";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { RequestStatus, Role } from "../../generated/prisma/enums.ts";
import {
  ICreateEmergencyRequest,
  IEmergencyRequestQuery,
} from "./emergencyRequest.interface.ts";
import { AuditLogService } from "../auditLog/auditLog.service.ts";

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

  await AuditLogService.createAuditLog({
    userId,
    action: "CREATE_EMERGENCY_REQUEST",
    entity: "EMERGENCY_REQUEST",
    entityId: emergencyRequest.id,
  });

  return emergencyRequest;
};

const getMyEmergencyRequests = async (
  userId: string,
  query: IEmergencyRequestQuery,
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
      "Only patient can view emergency requests",
    );
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const where: any = {
    patientId: userId,
  };

  if (query.status) {
    where.status = query.status;
  }

  if (query.priority) {
    where.priority = query.priority;
  }

  if (query.emergencyType) {
    where.emergencyType = {
      contains: query.emergencyType,
      mode: "insensitive",
    };
  }

  if (query.search) {
    where.OR = [
      {
        pickupLocation: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        destination: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        emergencyType: {
          contains: query.search,
          mode: "insensitive",
        },
      },
    ];
  }

  const allowedSortFields = [
    "createdAt",
    "updatedAt",
    "priority",
    "status",
    "emergencyType",
  ];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const [emergencyRequests, total] = await Promise.all([
    prisma.emergencyRequest.findMany({
      where,

      skip,
      take: limit,

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
        [sortBy]: sortOrder,
      },
    }),

    prisma.emergencyRequest.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: emergencyRequests,

    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
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
  await AuditLogService.createAuditLog({
    userId,
    action: "CANCEL_EMERGENCY_REQUEST",
    entity: "EMERGENCY_REQUEST",
    entityId: requestId,
  });

  return cancelledRequest;
};

export const EmergencyRequestService = {
  createEmergencyRequest,
  getMyEmergencyRequests,
  getEmergencyRequestById,
  cancelEmergencyRequest,
};
