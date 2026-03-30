import crypto from "crypto";
import { User } from "../models/user.model";
import { AuthSDK } from "./config";

export const generateVerificationToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

export const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const refresh = async (sdk: AuthSDK, refreshToken: string) => {
  const decoded = sdk.jwt.verifyRefreshToken(refreshToken) as any;

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

  const newAccessToken = sdk.jwt.signAccessToken({
    id: user._id.toString(),
    role: user.role,
  });

  return { accessToken: newAccessToken };
};