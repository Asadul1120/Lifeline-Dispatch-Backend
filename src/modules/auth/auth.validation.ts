import { z } from "zod";

export const registerValidation = z.object({
  name: z.string().min(3, "Name must be minimum 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be minimum 6 characters"),
});

export const verifyEmailValidation = z.object({
  email: z.string().email("Invalid email address"),
  otp: z.string().length(6, "OTP must be 6 characters"),
});

export const loginValidation = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string(),
});

export const refreshTokenValidation = z.object({
  token: z.string("Invalid token"),
});

export const googleLoginValidation = z.object({
  idToken: z.string("Invalid id token"),
});
