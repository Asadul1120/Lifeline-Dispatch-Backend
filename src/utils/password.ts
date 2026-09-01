import bcrypt from "bcryptjs";
import { config } from "../config/index.ts";

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, config.bcrypt_salt);
}

export function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
