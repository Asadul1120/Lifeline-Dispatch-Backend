import httpStatus from "http-status-codes";
import { prisma } from "../../lib/prisma.js";
import { AppError } from "../../utils/AppError.js";
import { Role, AuthProvider } from "../../generated/prisma/enums.js";
import { IDriverApplyPayload, IDriverVerifyEmail } from "./driver.interface.js";
import { hashPassword } from "../../utils/password.js";
import { redisClient } from "../../lib/redis.ts";
import crypto from "crypto";
import { sendEmail } from "../../utils/sendEmail.ts";
import { createToken } from "../../utils/token.ts";

const applyDriver = async (payload: IDriverApplyPayload) => {
  const {
    name,
    email,
    password,
    licenseNumber,
    experience,
    currentLocation,
    contactNumber,
  } = payload;

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (existingUser) {
    throw new AppError(
      httpStatus.CONFLICT,
      "An account already exists with this email.",
    );
  }

  const existingDriver = await prisma.driver.findUnique({
    where: {
      licenseNumber,
    },
  });

  if (existingDriver) {
    throw new AppError(
      httpStatus.CONFLICT,
      "A driver application already exists with this license number.",
    );
  }

  const hashedPassword = await hashPassword(password);

  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.DRIVER,
        authProvider: AuthProvider.CREDENTIAL,
        emailVerified: false,
        driver: {
          create: {
            licenseNumber,
            experience,
            currentLocation,
            contactNumber,
          },
        },
      },

      include: {
        driver: true,
      },

      omit: {
        password: true,
        googleId: true,
      },
    });

    return user;
  });

  const otpKey = `registration-otp:${email}`;
  const otpValue = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(otpKey, otpValue, {
    expiration: {
      type: "EX",
      value: 300,
    },
  });

  await sendEmail({
    to: email,
    subject: "Verify Your Email - Lifeline Dispatch",
    templateName: "UserRegistration-otp",
    templateData: {
      name,
      email,
      otp: otpValue,
      expirationMinutes: 5,
    },
  });
};

const VerifyDriver = async (payload: IDriverVerifyEmail) => {
  const { email, otp } = payload;

  const otpKey = `registration-otp:${email}`;
  const storedOtp = await redisClient.get(otpKey);

  if (!storedOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP expired or not found");
  }

  if (storedOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },

    include: {
      driver: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "Driver account not found");
  }

  if (user.role !== Role.DRIVER) {
    throw new AppError(httpStatus.BAD_REQUEST, "This is not a driver account");
  }

  if (user.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Email already verified");
  }

  const updatedUser = await prisma.user.update({
    where: {
      id: user.id,
    },
    data: {
      emailVerified: true,
    },
    include: {
      driver: true,
    },
    omit: {
      password: true,
      googleId: true,
    },
  });

  await redisClient.del(otpKey);

  await sendEmail({
    to: updatedUser.email,
    subject: "Welcome to Lifeline Dispatch",
    templateName: "UserRegistration-welcome",
    templateData: {
      name: updatedUser.name,
      email: updatedUser.email,
    },
  });

  const jwtPayload = {
    userId: updatedUser.id,
    name: updatedUser.name,
    email: updatedUser.email,
    role: updatedUser.role,
  };

  const accessToken = createToken(jwtPayload);
  const refreshToken = createToken(jwtPayload);

  return {
    user: updatedUser,
    accessToken,
    refreshToken,
  };
};

export const DriverService = {
  applyDriver,
  VerifyDriver,
};
