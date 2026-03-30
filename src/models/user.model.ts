import mongoose from "mongoose";
import { IUser, ISession } from "./types";

const sessionSchema = new mongoose.Schema<ISession>({
  token: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
});

const userSchema = new mongoose.Schema<IUser>({
  email: { type: String, index: true },
  password: String,
  role: { type: String, default: "user" },
  verified: { type: Boolean, default: false },
  tenantId: { type: String, index: true },
  refreshTokens: [sessionSchema],
  verificationTokens: [
    {
      token: String,
      expiresAt: Date,
    },
  ],
  provider: String,
});

export const User = mongoose.model<IUser>("User", userSchema);