import { z } from "zod";

export const createPaymentValidationSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  amount: z.number().positive("Amount must be greater than 0"),
});
