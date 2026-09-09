import { z } from "zod";

export const driverApplyValidation = z.object({
  name: z
    .string()
    .min(3, "Name must be minimum 3 characters")
    .max(100, "Name cannot exceed 100 characters"),

  email: z.string().email("Invalid email address"),

  password: z.string().min(6, "Password must be minimum 6 characters"),

  licenseNumber: z
    .string()
    .min(5, "License number must be minimum 5 characters")
    .max(50, "License number cannot exceed 50 characters"),

  experience: z
    .number()
    .int("Experience must be a whole number")
    .min(0, "Experience cannot be negative"),

  currentLocation: z
    .string()
    .max(255, "Location cannot exceed 255 characters")
    .optional(),

  contactNumber: z
    .string()
    .regex(/^01[3-9]\d{8}$/, "Invalid Bangladesh phone number")
    .optional(),
});



export const driverVerifyEmailValidation = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 characters"),
});