import httpStatus from "http-status-codes";
import { AppError } from "../../utils/AppError.js";
import { prisma } from "../../lib/prisma.js";
import { IUpdateUserPayload } from "./user.interface.ts";
import { Role } from "../../generated/prisma/enums.ts";
import cloudinary from "../../lib/cloudinary.ts";
import { UploadApiResponse } from "cloudinary";

const getMe = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      patient: true,
      driver: true,
    },

    omit: {
      password: true,
      googleId: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }
  return user;
};

const updateMe = async (
  userId: string,
  payload: IUpdateUserPayload,
  buffer?: any,
) => {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      patient: true,
      driver: true,
    },
  });

  if (!user) {
    throw new AppError(httpStatus.NOT_FOUND, "User not found.");
  }

  let cloudinaryResult: UploadApiResponse | null = null;

  if (buffer) {
    if (user.imagePublicId) {
      await cloudinary.uploader.destroy(user.imagePublicId);
    }

    cloudinaryResult = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "auto",
              folder: "lifeline/users",
            },

            async (error, result) => {
              if (error) {
                return reject(error);
              }

              if (!result) {
                return reject(new Error("No result returned from Cloudinary"));
              }

              resolve(result);
            },
          )
          .end(buffer);
      },
    );
  }

  // Update User
  await prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      ...(payload.name && {
        name: payload.name,
      }),

      ...(cloudinaryResult && {
        imageUrl: cloudinaryResult.secure_url,
        imagePublicId: cloudinaryResult.public_id,
      }),
    },
  });

  if (user.role === Role.PATIENT && payload.patient) {
    await prisma.patient.update({
      where: {
        userId,
      },

      data: {
        phone: payload.patient.phone,
        address: payload.patient.address,
        bloodGroup: payload.patient.bloodGroup,
        emergencyContact: payload.patient.emergencyContact,
      },
    });
  }

  if (user.role === Role.DRIVER && payload.driver) {
    await prisma.driver.update({
      where: {
        userId,
      },

      data: {
        licenseNumber: payload.driver.licenseNumber,
        experience: payload.driver.experience,
        currentLocation: payload.driver.currentLocation,
        contactNumber: payload.driver.contactNumber,
      },
    });
  }

  return await getMe(userId);
};

export const UserService = {
  getMe,
  updateMe,
};
