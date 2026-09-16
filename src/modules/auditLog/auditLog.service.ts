import httpStatus from "http-status-codes";

import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";

import { IAuditLogQuery, ICreateAuditLog } from "./auditLog.interface.ts";

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

const buildAuditLogQuery = (query: IAuditLogQuery) => {
  const page = Math.max(Number(query.page) || 1, 1);

  const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);

  const skip = (page - 1) * limit;

  const allowedSortFields = ["createdAt", "action", "entity"];

  const sortBy = allowedSortFields.includes(query.sortBy || "")
    ? query.sortBy!
    : "createdAt";

  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";

  const where: any = {};

  if (query.userId) {
    where.userId = query.userId;
  }

  if (query.action) {
    where.action = {
      contains: query.action,
      mode: "insensitive",
    };
  }

  if (query.entity) {
    where.entity = {
      contains: query.entity,
      mode: "insensitive",
    };
  }

  if (query.search) {
    where.OR = [
      {
        action: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        entity: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        entityId: {
          contains: query.search,
          mode: "insensitive",
        },
      },
      {
        user: {
          name: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      },
      {
        user: {
          email: {
            contains: query.search,
            mode: "insensitive",
          },
        },
      },
    ];
  }

  if (query.dateFrom || query.dateTo) {
    where.createdAt = {};

    if (query.dateFrom) {
      const dateFrom = new Date(query.dateFrom);

      if (!Number.isNaN(dateFrom.getTime())) {
        where.createdAt.gte = dateFrom;
      }
    }

    if (query.dateTo) {
      const dateTo = new Date(query.dateTo);

      if (!Number.isNaN(dateTo.getTime())) {
        dateTo.setHours(23, 59, 59, 999);
        where.createdAt.lte = dateTo;
      }
    }

    if (Object.keys(where.createdAt).length === 0) {
      delete where.createdAt;
    }
  }

  return {
    where,
    page,
    limit,
    skip,
    sortBy,
    sortOrder,
  };
};

const getAllAuditLogs = async (query: IAuditLogQuery = {}) => {
  const { where, page, limit, skip, sortBy, sortOrder } =
    buildAuditLogQuery(query);

  const [auditLogs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,

      skip,
      take: limit,

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
        [sortBy]: sortOrder,
      },
    }),

    prisma.auditLog.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: auditLogs,

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

const getAuditLogsByUser = async (
  userId: string,
  query: IAuditLogQuery = {},
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found");
  }

  const { where, page, limit, skip, sortBy, sortOrder } = buildAuditLogQuery({
    ...query,
    userId,
  });

  const [auditLogs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,

      skip,
      take: limit,

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
        [sortBy]: sortOrder,
      },
    }),

    prisma.auditLog.count({
      where,
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: auditLogs,

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

export const AuditLogService = {
  createAuditLog,
  getAllAuditLogs,
  getAuditLogsByUser,
};
