import { z } from "zod";

export const updateTripStatusValidation = z.object({
  status: z.enum(["ONGOING", "COMPLETED", "CANCELLED"]),
});
