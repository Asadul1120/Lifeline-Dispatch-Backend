import { config } from "../../config/index.ts";
import { PaymentMethod, PaymentStatus } from "../../generated/prisma/enums.ts";
import { getBkashIdToken } from "../../lib/bkash.ts";
import { prisma } from "../../lib/prisma.ts";
import { AuditLogService } from "../auditLog/auditLog.service.ts";
import { ICreatePayment, IPaymentCallback } from "./payment.interface.ts";

const createPayment = async (userId: string, payload: ICreatePayment) => {
  const request = await prisma.emergencyRequest.findUnique({
    where: {
      id: payload.requestId,
    },
  });

  if (!request) {
    throw new Error("Emergency Request Not Found");
  }

  if (request.patientId !== userId) {
    throw new Error("You are not allowed to pay for this request");
  }

  const existingPayment = await prisma.payment.findUnique({
    where: {
      requestId: payload.requestId,
    },
  });

  if (existingPayment) {
    throw new Error("Payment already exists for this request");
  }

  const payment = await prisma.payment.create({
    data: {
      requestId: payload.requestId,
      amount: payload.amount,
      gateway: "bKash",
      method: PaymentMethod.bKash,
      status: PaymentStatus.PENDING,
    },
  });

  await AuditLogService.createAuditLog({
    userId,
    action: "CREATE_PAYMENT",
    entity: "PAYMENT",
    entityId: payment.id,
  });

  const idToken = await getBkashIdToken();

  const res = await fetch(
    `${config.bkash_tokenize_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${idToken}`,
        "X-App-Key": config.bkash_tokenize_app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference: userId,
        callbackURL: `${config.bkash_callback_url}/api/v1/payment/bkash/callback`,
        amount: payload.amount.toFixed(2),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: payment.id,
      }),
    },
  );

  const data = await res.json();

  if (!res.ok || !data.paymentID) {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    throw new Error(data.statusMessage || "bKash payment creation failed");
  }

  return {
    paymentId: payment.id,
    paymentID: data.paymentID,
    bkashURL: data.bkashURL,
    amount: payment.amount,
    status: payment.status,
  };
};

const paymentCallback = async (payload: IPaymentCallback) => {
  const paymentID = payload.paymentID;
  const status = payload.status;

  if (!paymentID) {
    throw new Error("Payment Id Missing");
  }

  if (!status) {
    throw new Error("Payment Status is Missing");
  }

  const payment = await prisma.payment.findFirst({
    where: {
      id: payload.merchantInvoiceNumber,
    },
    include: {
      request: true,
    },
  });

  if (!payment) {
    throw new Error("Payment record not found");
  }

  const bkashIdToken = await getBkashIdToken();

  if (!bkashIdToken) {
    throw new Error("No Bkash Access Token Found!");
  }

  const res = await fetch(
    `${config.bkash_tokenize_base_url}/tokenized/checkout/execute`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${bkashIdToken}`,
        "X-App-Key": config.bkash_tokenize_app_key,
      },
      body: JSON.stringify({
        paymentID,
      }),
    },
  );

  const data = await res.json();

  if (status === "success") {
    if (data?.transactionStatus === "Completed" && data?.trxID) {
      const updatedPayment = await prisma.payment.update({
        where: {
          id: payment.id,
        },
        data: {
          transactionId: data.trxID,
          status: PaymentStatus.PAID,
        },
      });

      await AuditLogService.createAuditLog({
        userId: payment.request.patientId,
        action: "PAYMENT_SUCCESS",
        entity: "PAYMENT",
        entityId: payment.id,
      });

      return {
        ...data,
        payment: updatedPayment,
        redirectUrl: `${config.frontend_url}/payment/success`,
      };
    }

    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    return {
      ...data,
      redirectUrl: `${config.frontend_url}/payment/failed`,
    };
  }

  if (status === "failure") {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    return {
      ...data,
      redirectUrl: `${config.frontend_url}/payment/failed`,
    };
  }

  if (status === "cancel") {
    await prisma.payment.update({
      where: {
        id: payment.id,
      },
      data: {
        status: PaymentStatus.FAILED,
      },
    });

    return {
      ...data,
      redirectUrl: `${config.frontend_url}/payment/cancel`,
    };
  }

  return {
    ...data,
    redirectUrl: `${config.frontend_url}/payment/unknown`,
  };
};

const getMyPayments = async (userId: string) => {
  return prisma.payment.findMany({
    where: {
      request: {
        patientId: userId,
      },
    },
    include: {
      request: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getPaymentById = async (userId: string, paymentId: string) => {
  const payment = await prisma.payment.findUnique({
    where: {
      id: paymentId,
    },
    include: {
      request: true,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (payment.request.patientId !== userId) {
    throw new Error("You are not allowed to view this payment");
  }

  return payment;
};

export const paymentService = {
  createPayment,
  paymentCallback,
  getMyPayments,
  getPaymentById,
};
