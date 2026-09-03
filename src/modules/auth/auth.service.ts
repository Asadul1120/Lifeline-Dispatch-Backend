import { AuthProvider } from "../../generated/prisma/enums.ts";
import { prisma } from "../../lib/prisma.ts";
import { redisClient } from "../../lib/redis.ts";
import { comparePassword, hashPassword } from "../../utils/password.ts";
import {
  ILoginPayload,
  IRegisterPayload,
  IVerifyEmailPayload,
} from "./auth.interface.ts";

import crypto from "crypto";
import { createToken } from "../../utils/token.ts";
import { sendEmail } from "../../utils/sendEmail.ts";
import { AppError } from "../../utils/AppError.ts";
import httpStatus from "http-status-codes";

const RegisterUser = async (payload: IRegisterPayload) => {
  const { name, email, password } = payload;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    if (
      existingUser.googleId ||
      existingUser.authProvider === AuthProvider.GOOGLE
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "User already exists with Google login. Please use Google login to sign in.",
      );
    }
    throw new AppError(httpStatus.BAD_REQUEST, "User already exists");
  }

  const hashedPassword = await hashPassword(password);

  const otpKey = `registration-otp:${email}`;
  const otpValue = crypto.randomInt(100000, 1000000).toString();

  await redisClient.set(otpKey, otpValue, {
    expiration: {
      type: "EX",
      value: 5 * 60, // 5 minutes
    },
  });

  const setUser = {
    name,
    email,
    password: hashedPassword,
  };

  const userKey = `registration-user:${email}`;
  await redisClient.set(userKey, JSON.stringify(setUser), {
    expiration: {
      type: "EX",
      value: 5 * 60, // 5 minutes
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

const VerifyUser = async (payload: IVerifyEmailPayload) => {
  const { email, otp } = payload;

  const otpKey = `registration-otp:${email}`;
  const storedOtp = await redisClient.get(otpKey);

  if (!storedOtp) {
    throw new AppError(httpStatus.BAD_REQUEST, "OTP expired or not found");
  }
  if (storedOtp !== otp) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid OTP");
  }

  const userKey = `registration-user:${email}`;
  const storedUser = await redisClient.get(userKey);
  if (!storedUser) {
    throw new AppError(httpStatus.BAD_REQUEST, "User data expired or not found");
  }

  const user = JSON.parse(storedUser);

  const createdUser = await prisma.user.create({
    data: {
      name: user.name,
      email: user.email,
      password: user.password,
      emailVerified: true,
      patient: {
        create: {
          phone: "",
          address: "",
        },
      },
    },
    omit: { password: true },
    include: { patient: true },
  });

  await redisClient.del(otpKey);
  await redisClient.del(userKey);

  await sendEmail({
    to: createdUser.email,
    subject: "Welcome to Lifeline Dispatch",
    templateName: "UserRegistration-welcome",
    templateData: {
      name: createdUser.name,
      email: createdUser.email,
    },
  });

  const jwtPayload = {
    userId: createdUser.id,
    name: createdUser.name,
    email: createdUser.email,
    role: createdUser.role,
  };

  const accessToken = createToken(jwtPayload);
  const refreshToken = createToken(jwtPayload);

  return {
    user: createdUser,
    accessToken,
    refreshToken,
  };
};

const LoginUser = async (payload: ILoginPayload) => {
  const { email, password } = payload;

  

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid email");
  }

  if (!user.emailVerified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Please verify your email first");
  }

  if (user.authProvider === AuthProvider.GOOGLE) {
    throw new AppError(httpStatus.BAD_REQUEST, "Please use Google login to sign in.");
  }

  const isPasswordValid = await comparePassword(
    password,
    user.password as string,
  );

  if (!isPasswordValid) {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid password");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const accessToken = createToken(jwtPayload);

  const refreshToken = createToken(jwtPayload);

  return {
    accessToken,
    refreshToken,
  };
};

export const authService = {
  RegisterUser,
  VerifyUser,
  LoginUser,
};
