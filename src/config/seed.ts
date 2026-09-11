import httpStatus from "http-status-codes";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../utils/AppError.js";
import { config } from "./index.js";
import { hashPassword } from "../utils/password.js";
import { AuthProvider, Role } from "../generated/prisma/enums.js";

export const seedTesterAdmin = async () => {
  try {
    const isTesterAdminExist = await prisma.user.findUnique({
      where: {
        email: config.tester_admin_email,
      },
    });

    if (isTesterAdminExist) {
      console.log("Tester Admin Already Exists!");

      return;
    }

    const {
      tester_admin_name: name,
      tester_admin_email: email,
      tester_admin_password: password,
    } = config;

    if (!name || !email || !password) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        "Tester Admin Name, Email, Password Missing In Env File!",
      );
    }

    const hashedPassword = await hashPassword(password);

    const testerAdmin = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: Role.ADMIN,
        authProvider: AuthProvider.CREDENTIAL,
        emailVerified: true,
      },
    });

    console.log("Tester Admin Created:", testerAdmin.email);
  } catch (error) {
    console.log("Error Seeding Tester Admin:", error);
  }
};
