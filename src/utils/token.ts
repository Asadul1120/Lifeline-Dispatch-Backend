import jwt, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { config } from "../config/index.ts";



export function createToken(payload: object): string {
  return jwt.sign(payload, config.jwt_access_secret, {
    expiresIn: config.jwt_access_expires_in as SignOptions["expiresIn"],
  });
}

export function verifyToken(token: string): string | JwtPayload {
  return jwt.verify(token, config.jwt_access_secret);
}
