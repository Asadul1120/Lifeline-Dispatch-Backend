import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";
import { prisma } from "../lib/prisma.js";
import { catchAsync } from "../utils/catchAsync.js";
import { Role, UserStatus } from "../generated/prisma/browser.ts";
import { verifyToken } from "../utils/token.ts";

const Auth = (...requiredRoles: Role[]) => {
  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    // Get Token
    const token = req.cookies?.accessToken
      ? req.cookies.accessToken
      : req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : req.headers.authorization;

    if (!token) {
      throw new Error("Access token not found.");
    }

    // Verify Token
    const verifiedToken = verifyToken(token) as JwtPayload;
    const { userId } = verifiedToken;

    if (!userId) {
      throw new Error("Invalid access token.");
    }

    // Check User
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    // Check User Status
    if (user.status === UserStatus.SUSPENDED) {
      throw new Error("Your account has been suspended.");
    }

    if (user.status === UserStatus.BANNED) {
      throw new Error("Your account has been banned.");
    }

    // Check Role
    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new Error("You are not authorized to access this resource.");
    }

    // Set User
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  });
};

export default Auth;
