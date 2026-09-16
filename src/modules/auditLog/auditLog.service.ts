import httpStatus from "http-status-codes";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";

import { ICreateAuditLog } from "./auditLog.interface.ts";

const createAuditLog = async (payload: ICreateAuditLog) => {
  const user = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const auditLog = await prisma.auditLog.create({
    data: {
      userId: payload.userId,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId,
    },

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
  });

  return auditLog;
};

const getAllAuditLogs = async () => {
  const auditLogs = await prisma.auditLog.findMany({
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

    orderBy: {
      createdAt: "desc",
    },
  });

  return auditLogs;
};

const getAuditLogsByUser = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      userId,
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return auditLogs;
};

export const AuditLogService = {
  createAuditLog,
  getAllAuditLogs,
  getAuditLogsByUser,
};
