import jwt from "jsonwebtoken";
import { getConfig } from "./config";

interface JWTPayload {
  id: string;
  role?: string;
  tenantId?: string;
}

export const signAccessToken = <T extends JWTPayload>(payload: T) => {
  const { jwtSecret } = getConfig();

  return jwt.sign(payload, jwtSecret as string, {
    expiresIn: "15m",
  } as jwt.SignOptions);
};

export const signRefreshToken = <T extends JWTPayload>(payload: T) => {
  const { refreshSecret } = getConfig();
  if (!refreshSecret) throw new Error("Missing refresh secret");
  return jwt.sign(payload, refreshSecret as string, {
    expiresIn: "7d",
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string) => {
  const { jwtSecret } = getConfig();
  return jwt.verify(token, jwtSecret);
};

export const verifyRefreshToken = (token: string) => {
   const config = getConfig();

  if (!config.refreshSecret) {
    throw new Error("Missing refresh secret");
  }
  return jwt.verify(token, config.refreshSecret);
};