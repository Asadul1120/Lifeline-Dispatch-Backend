import httpStatus from "http-status-codes";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import {
  AmbulanceStatus,
  DriverApplicationStatus,
  RequestStatus,
  Role,
} from "../../generated/prisma/enums.ts";
import { AuditLogService } from "../auditLog/auditLog.service.ts";

const getPendingDrivers = async () => {
  const drivers = await prisma.driver.findMany({
    where: {
      applicationStatus: DriverApplicationStatus.PENDING,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          imageUrl: true,
        },
      },
    },
  });

  return drivers;
};

const approveDriver = async (driverId: string, adminId: string) => {
  const driver = await prisma.driver.findUnique({
    where: {
      id: driverId,
    },

    include: {
      user: true,
    },
  });

  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  if (driver.applicationStatus !== DriverApplicationStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Driver application already processed",
    );
  }

  if (!driver.user.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Driver email is not verified");
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: adminId,
    },
  });

  if (!admin) {
    throw new AppError(httpStatus.NOT_FOUND, "Admin not found");
  }

  if (admin.role !== Role.ADMIN) {
    throw new AppError(httpStatus.BAD_REQUEST, "This is not an admin account");
  }

  const updatedDriver = await prisma.driver.update({
    where: {
      id: driverId,
    },

    data: {
      applicationStatus: DriverApplicationStatus.APPROVED,
      isAvailable: true,
      approvedBy: admin.id,
      approvedAt: new Date(),
    },

    include: {
      user: {
        omit: {
          password: true,
        },
      },
    },
  });

  await AuditLogService.createAuditLog({
    userId: adminId,
    action: "APPROVE_DRIVER",
    entity: "DRIVER",
    entityId: driverId,
  });

  return updatedDriver;
};

const rejectDriver = async (driverId: string, adminId: string) => {
  const driver = await prisma.driver.findUnique({
    where: {
      id: driverId,
    },
  });

  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  if (driver.applicationStatus !== DriverApplicationStatus.PENDING) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Driver application already processed",
    );
  }

  const admin = await prisma.user.findUnique({
    where: {
      id: adminId,
    },
  });

  if (!admin) {
    throw new AppError(httpStatus.NOT_FOUND, "Admin not found");
  }

  if (admin.role !== Role.ADMIN) {
    throw new AppError(httpStatus.BAD_REQUEST, "This is not an admin account");
  }

  const rejectedDriver = await prisma.driver.update({
    where: {
      id: driverId,
    },

    data: {
      applicationStatus: DriverApplicationStatus.REJECTED,
      isAvailable: false,
      approvedBy: admin.id,
      approvedAt: new Date(),
    },

    include: {
      user: {
        omit: {
          password: true,
        },
      },
    },
  });

  await AuditLogService.createAuditLog({
    userId: adminId,
    action: "REJECT_DRIVER",
    entity: "DRIVER",
    entityId: driverId,
  });

  return rejectedDriver;
};

const assignAmbulance = async (
  requestId: string,
  ambulanceId: string,
  adminId: string,
) => {
  const result = await prisma.$transaction(async (tx) => {
    const emergencyRequest = await tx.emergencyRequest.findUnique({
      where: {
        id: requestId,
      },
    });

    if (!emergencyRequest) {
      throw new AppError(httpStatus.NOT_FOUND, "Emergency request not found");
    }

    if (emergencyRequest.status !== RequestStatus.PENDING) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Only pending requests can be assigned",
      );
    }

    const ambulance = await tx.ambulance.findUnique({
      where: {
        id: ambulanceId,
      },
      include: {
        driver: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!ambulance) {
      throw new AppError(httpStatus.NOT_FOUND, "Ambulance not found");
    }

    if (ambulance.status !== AmbulanceStatus.AVAILABLE) {
      throw new AppError(httpStatus.BAD_REQUEST, "Ambulance is not available");
    }

    if (
      ambulance.driver.applicationStatus !== DriverApplicationStatus.APPROVED
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Ambulance driver is not approved",
      );
    }

    if (!ambulance.driver.isAvailable) {
      throw new AppError(httpStatus.BAD_REQUEST, "Driver is not available");
    }

    const updatedRequest = await tx.emergencyRequest.update({
      where: {
        id: requestId,
      },
      data: {
        ambulanceId: ambulance.id,
        status: RequestStatus.ASSIGNED,
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
      },
    });

    await tx.ambulance.update({
      where: {
        id: ambulance.id,
      },
      data: {
        status: AmbulanceStatus.BUSY,
      },
    });

    await tx.driver.update({
      where: {
        id: ambulance.driverId,
      },
      data: {
        isAvailable: false,
      },
    });

    return updatedRequest;
  });

  await AuditLogService.createAuditLog({
    userId: adminId,
    action: "ASSIGN_AMBULANCE",
    entity: "EMERGENCY_REQUEST",
    entityId: requestId,
  });

  return result;
};

const getAllEmergencyRequests = async (query: {
  page?: string;
  limit?: string;
  status?: string;
  priority?: string;
  emergencyType?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
}) => {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const where: any = {};

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
      {
        patient: {
          name: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      },
      {
        patient: {
          email: {
            contains: query.search,
            mode: "insensitive",
          },
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

  const [requests, total] = await Promise.all([
    prisma.emergencyRequest.findMany({
      where,
      skip,
      take: limit,

      include: {
        patient: {
          select: {
            id: true,
            name: true,
            email: true,
            imageUrl: true,
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
    data: requests,

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

const getEmergencyRequestByIdForAdmin = async (requestId: string) => {
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
          imageUrl: true,
          role: true,
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
                  role: true,
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

  return emergencyRequest;
};

export const AdminService = {
  getPendingDrivers,
  approveDriver,
  rejectDriver,
  assignAmbulance,
  getAllEmergencyRequests,
  getEmergencyRequestByIdForAdmin,
};
