import httpStatus from "http-status-codes";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { DriverApplicationStatus, Role } from "../../generated/prisma/enums.ts";

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

  return rejectedDriver;
};

export const AdminService = {
  getPendingDrivers,
  approveDriver,
  rejectDriver,
};
