import {
  AuthProvider,
  Role,
  UserStatus,
} from "../../generated/prisma/enums.ts";
import { prisma } from "../../lib/prisma.ts";
import { redisClient } from "../../lib/redis.ts";
import { comparePassword, hashPassword } from "../../utils/password.ts";
import {
  IGoogleLoginPayload,
  ILoginPayload,
  IRegisterPayload,
  IVerifyEmailPayload,
} from "./auth.interface.ts";

import crypto from "crypto";
import { createToken, verifyToken } from "../../utils/token.ts";
import { sendEmail } from "../../utils/sendEmail.ts";
import { AppError } from "../../utils/AppError.ts";
import httpStatus from "http-status-codes";
import { TokenPayload } from "google-auth-library";
import { googleClient } from "../../lib/googleClient.ts";
import { config } from "../../config/index.ts";

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
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "User data expired or not found",
    );
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
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please verify your email first",
    );
  }

  if (user.authProvider === AuthProvider.GOOGLE) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Please use Google login to sign in.",
    );
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

const refreshToken = async (token: string) => {
  if (!token) {
    throw new AppError(httpStatus.BAD_REQUEST, "token is missing ");
  }
  const decoded = verifyToken(token);

  if (typeof decoded === "string") {
    throw new AppError(httpStatus.BAD_REQUEST, "Invalid token");
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    throw new AppError(httpStatus.BAD_REQUEST, "User not found");
  }
  if (user.status !== UserStatus.ACTIVE) {
    throw new AppError(httpStatus.BAD_REQUEST, "User is not active");
  }

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
  };

  const accessToken = createToken(jwtPayload);
  const refreshToken = createToken(jwtPayload);

  return { accessToken, refreshToken };
};

const googleLogin = async (payload: IGoogleLoginPayload) => {
  let googleIdTokenPayload: TokenPayload | undefined;
  // Verify Google ID Token

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: payload.idToken,
      audience: config.google_client_id,
    });

    googleIdTokenPayload = ticket.getPayload();
  } catch (error) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid or expired Google ID token.",
    );
  }

  if (!googleIdTokenPayload) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      "Invalid or expired Google ID token.",
    );
  }

  const googleEmail = googleIdTokenPayload.email;
  const googleName = googleIdTokenPayload.name;
  const googleId = googleIdTokenPayload.sub;

  if (!googleEmail) {
    throw new AppError(httpStatus.BAD_REQUEST, "Google email not found.");
  }

  if (!googleName) {
    throw new AppError(httpStatus.BAD_REQUEST, "Google user name not found.");
  }

  if (!googleIdTokenPayload.email_verified) {
    throw new AppError(httpStatus.BAD_REQUEST, "Google email is not verified.");
  }

  // Find existing user

  let user = await prisma.user.findUnique({
    where: {
      email: googleEmail,
    },
  });

  // Existing account handling
  if (user) {
    if (user.role !== Role.PATIENT) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "Google login is available for patients only",
      );
    }
    if (user.status === UserStatus.SUSPENDED) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        "Your account has been suspended.",
      );
    }

    if (user.status === UserStatus.BANNED) {
      throw new AppError(httpStatus.FORBIDDEN, "Your account has been banned.");
    }

    if (user.googleId && user.googleId !== googleId) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        "This account is already linked with another Google account",
      );
    }

    // Update Google information if missing

    if (!user.googleId || !user.emailVerified) {
      user = await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          googleId,
          emailVerified: true,
        },
      });
    }
  } else {
    user = await prisma.user.create({
      data: {
        name: googleName,
        email: googleEmail,
        role: Role.PATIENT,
        googleId,
        authProvider: AuthProvider.GOOGLE,
        emailVerified: true,
        patient: {
          create: {},
        },
      },
    });

    await sendEmail({
      to: googleEmail,
      subject: "Welcome To LifeLine Dispatch",
      templateName: "UserRegistration-welcome",
      templateData: {
        name: googleName,
        email: googleEmail,
      },
    });
  }

  // Generate JWT
  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
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
  refreshToken,
  googleLogin,
};
