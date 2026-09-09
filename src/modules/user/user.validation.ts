import { z } from "zod";

export const updateProfileValidation = z.object({
  name: z
    .string()
    .min(3, "Name must be minimum 3 characters")
    .max(100, "Name cannot exceed 100 characters")
    .optional(),
  patient: z
    .object({
      phone: z.string().optional(),

      address: z.string().max(255, "Address too long").optional(),

      bloodGroup: z
        .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"])
        .optional(),
      emergencyContact: z.string().optional(),
    })
    .optional(),

  driver: z
    .object({
      licenseNumber: z.string().optional(),
      experience: z.coerce
        .number()
        .min(0, "Experience cannot be negative")
       .optional(),
      currentLocation: z.string().optional(),
      contactNumber: z.string().optional(),
    })
    .optional(),
});
