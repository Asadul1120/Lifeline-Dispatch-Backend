import { z } from "zod";
import {
  AmbulanceStatus,
  AmbulanceType,
} from "../../generated/prisma/enums.ts";

export const createAmbulanceValidation = z.object({
  driverId: z.string().uuid("Invalid driver ID"),

  vehicleNumber: z
    .string()
    .min(3, "Vehicle number must be at least 3 characters")
    .max(50, "Vehicle number cannot exceed 50 characters"),

  type: z.nativeEnum(AmbulanceType).optional(),

  location: z
    .string()
    .max(255, "Location cannot exceed 255 characters")
    .optional(),
});

export const updateAmbulanceValidation = z.object({
  vehicleNumber: z.string().min(3).max(50).optional(),

  type: z.nativeEnum(AmbulanceType).optional(),

  location: z.string().max(255).optional(),
});

export const updateAmbulanceStatusValidation = z.object({
  status: z.nativeEnum(AmbulanceStatus),

  location: z.string().max(255).optional(),
});
