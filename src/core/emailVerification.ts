import crypto from "crypto";
import { signAccessToken, verifyRefreshToken } from "./jwt";
import { User } from "../models/user.model";

export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const refresh = async (refreshToken: string) => {
  const decoded = verifyRefreshToken(refreshToken) as any;

  const user = await User.findById(decoded.id);
  if (!user) throw new Error("User not found");

  const hashed = hashToken(refreshToken);

  const session = user.refreshTokens.find(
    (t) => t.token === hashed
  );

  if (!session) throw new Error("Invalid session");

  if (new Date() > session.expiresAt) {
    throw new Error("Session expired");
  }

  const newAccessToken = signAccessToken({
    id: user._id,//type not assignable to str...
    role: user.role,
  });

  return { accessToken: newAccessToken };
};