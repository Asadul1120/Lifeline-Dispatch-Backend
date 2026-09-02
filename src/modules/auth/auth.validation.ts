import { z } from "zod";

export const registerValidation = z.object({
  name: z.string().min(3, "Name must be minimum 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be minimum 6 characters"),
});

export const loginValidation = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
});
