import { z } from "zod";

export const assignAmbulanceValidation = z.object({
  ambulanceId: z.string().uuid("Invalid ambulance ID"),
});
