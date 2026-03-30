import jwt from "jsonwebtoken";
import { getConfig } from "./config";

export const signToken = <T extends object>(payload: T) => {
  const { jwtSecret, jwtExpiresIn } = getConfig();

  return jwt.sign(payload, jwtSecret as string, {
    expiresIn: jwtExpiresIn ?? "1h",
  } as jwt.SignOptions);
};

export const verifyToken = (token: string) => {
  const { jwtSecret } = getConfig();
  return jwt.verify(token, jwtSecret);
};