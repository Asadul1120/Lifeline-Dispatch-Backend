import { prisma } from "../../lib/prisma.ts";

const getSummary = async () => {
  const [
    users,
    userStatuses,
    applications,
    requests,
    ambulances,
    trips,
    payments,
    recentRequests,
    recentActivity,
  ] = await Promise.all([
    prisma.user.groupBy({
      by: ["role"],
      _count: { _all: true },
    }),
    prisma.user.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.driver.groupBy({
      by: ["applicationStatus"],
      _count: { _all: true },
    }),
    prisma.emergencyRequest.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.ambulance.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.trip.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
    prisma.payment.groupBy({
      by: ["status"],
      _count: { _all: true },
      _sum: { amount: true },
    }),
    prisma.emergencyRequest.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        emergencyType: true,
        priority: true,
        status: true,
        createdAt: true,
        patient: {
          select: { name: true },
        },
      },
    }),
    prisma.auditLog.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        action: true,
        entity: true,
        createdAt: true,
        user: {
          select: { name: true },
        },
      },
    }),
  ]);

  const countStatus = (
    rows: { status: string; _count: { _all: number } }[],
    status: string,
  ) => {
    return rows.find((row) => row.status === status)?._count._all ?? 0;
  };

  const total = (rows: { _count: { _all: number } }[]) => {
    return rows.reduce((sum, row) => sum + row._count._all, 0);
  };

  return {
    generatedAt: new Date().toISOString(),
    users: {
      total: total(users),
      patients: users.find((row) => row.role === "PATIENT")?._count._all ?? 0,
      drivers: users.find((row) => row.role === "DRIVER")?._count._all ?? 0,
      admins: users.find((row) => row.role === "ADMIN")?._count._all ?? 0,
      suspended: countStatus(userStatuses, "SUSPENDED"),
      banned: countStatus(userStatuses, "BANNED"),
    },
    applications: {
      pending:
        applications.find((row) => row.applicationStatus === "PENDING")?._count
          ._all ?? 0,
      approved:
        applications.find((row) => row.applicationStatus === "APPROVED")?._count
          ._all ?? 0,
      rejected:
        applications.find((row) => row.applicationStatus === "REJECTED")?._count
          ._all ?? 0,
    },
    requests: {
      total: total(requests),
      pending: countStatus(requests, "PENDING"),
      active:
        countStatus(requests, "ASSIGNED") +
        countStatus(requests, "ON_THE_WAY") +
        countStatus(requests, "PICKED_UP"),
      completed: countStatus(requests, "COMPLETED"),
      cancelled: countStatus(requests, "CANCELLED"),
    },
    fleet: {
      total: total(ambulances),
      available: countStatus(ambulances, "AVAILABLE"),
      busy: countStatus(ambulances, "BUSY"),
      maintenance: countStatus(ambulances, "MAINTENANCE"),
    },
    trips: {
      total: total(trips),
      active: countStatus(trips, "STARTED") + countStatus(trips, "ONGOING"),
      completed: countStatus(trips, "COMPLETED"),
      cancelled: countStatus(trips, "CANCELLED"),
    },
    payments: {
      total: total(payments),
      paid: countStatus(payments, "PAID"),
      pending: countStatus(payments, "PENDING"),
      failed: countStatus(payments, "FAILED"),
      paidAmount:
        payments
          .find((row) => row.status === "PAID")
          ?._sum.amount?.toString() ?? "0",
    },
    recentRequests,
    recentActivity,
  };
};

export const AdminDashboardService = {
  getSummary,
};
