import { z } from "zod";
import { Priority } from "../../generated/prisma/enums.ts";

export const createEmergencyRequestValidation = z.object({
  pickupLocation: z.string().max(255, "Pickup location too long"),
  destination: z.string().max(255, "Destination too long").optional(),
  emergencyType: z.string().max(100, "Emergency type too long"),
  priority: z.nativeEnum(Priority).optional(),
});
