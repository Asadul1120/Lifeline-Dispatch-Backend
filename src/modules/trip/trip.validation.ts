import { z } from "zod";

export const updateTripStatusValidation = z.object({
  status: z.enum(["ONGOING", "COMPLETED", "CANCELLED"]),
  reason: z.string().trim().max(255).optional(),
});

export const cancelTripValidation = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Cancellation reason is required")
    .max(255, "Cancellation reason cannot exceed 255 characters"),
});
