import httpStatus from "http-status-codes";
import {
  AmbulanceStatus,
  AmbulanceType,
  DriverApplicationStatus,
  Role,
} from "../../generated/prisma/enums.ts";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";

import {
  ICreateAmbulance,
  IUpdateAmbulance,
  IUpdateAmbulanceStatus,
} from "./ambulance.interface.ts";

const createAmbulance = async (payload: ICreateAmbulance) => {
  const { driverId, vehicleNumber, type, location } = payload;

  const driver = await prisma.driver.findUnique({
    where: {
      id: driverId,
    },
    include: {
      user: true,
      ambulance: true,
    },
  });

  if (!driver) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver not found");
  }

  if (driver.user.role !== Role.DRIVER) {
    throw new AppError(httpStatus.BAD_REQUEST, "Selected user is not a driver");
  }

  if (driver.applicationStatus !== DriverApplicationStatus.APPROVED) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Only approved drivers can have an ambulance",
    );
  }

  if (driver.ambulance) {
    throw new AppError(
      httpStatus.CONFLICT,
      "This driver already has an ambulance",
    );
  }

  const existingAmbulance = await prisma.ambulance.findUnique({
    where: {
      vehicleNumber,
    },
  });

  if (existingAmbulance) {
    throw new AppError(
      httpStatus.CONFLICT,
      "An ambulance already exists with this vehicle number",
    );
  }

  const ambulance = await prisma.ambulance.create({
    data: {
      driverId,
      vehicleNumber,
      type: type ?? AmbulanceType.BASIC,
      status: AmbulanceStatus.AVAILABLE,
      location,
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
    },
  });

  return ambulance;
};

const getAllAmbulances = async () => {
  return await prisma.ambulance.findMany({
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
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getAmbulanceById = async (id: string) => {
  const ambulance = await prisma.ambulance.findUnique({
    where: {
      id,
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
    },
  });

  if (!ambulance) {
    throw new AppError(httpStatus.NOT_FOUND, "Ambulance not found");
  }

  return ambulance;
};

const updateAmbulance = async (id: string, payload: IUpdateAmbulance) => {
  const ambulance = await prisma.ambulance.findUnique({
    where: {
      id,
    },
  });

  if (!ambulance) {
    throw new AppError(httpStatus.NOT_FOUND, "Ambulance not found");
  }

  if (payload.vehicleNumber) {
    const existing = await prisma.ambulance.findUnique({
      where: {
        vehicleNumber: payload.vehicleNumber,
      },
    });

    if (existing && existing.id !== id) {
      throw new AppError(httpStatus.CONFLICT, "Vehicle number already exists");
    }
  }

  return await prisma.ambulance.update({
    where: {
      id,
    },
    data: payload,
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
  });
};

const updateAmbulanceStatus = async (
  id: string,
  payload: IUpdateAmbulanceStatus,
) => {
  const ambulance = await prisma.ambulance.findUnique({
    where: {
      id,
    },
  });

  if (!ambulance) {
    throw new AppError(httpStatus.NOT_FOUND, "Ambulance not found");
  }

  if (
    ambulance.status === AmbulanceStatus.MAINTENANCE &&
    payload.status === AmbulanceStatus.BUSY
  ) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Ambulance under maintenance cannot become busy",
    );
  }

  return await prisma.ambulance.update({
    where: {
      id,
    },
    data: {
      status: payload.status,
      ...(payload.location !== undefined && {
        location: payload.location,
      }),
    },
  });
};

export const AmbulanceService = {
  createAmbulance,
  getAllAmbulances,
  getAmbulanceById,
  updateAmbulance,
  updateAmbulanceStatus,
};
