import mongoose from "mongoose";
import { ISession, IUser } from "./types";

const sessionSchema = new mongoose.Schema<ISession>({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

const userSchema = new mongoose.Schema<IUser>({
  email: { type: String, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  verified: { type: Boolean, default: false },
  refreshTokens: [sessionSchema],
  tenantId: { type: String, index: true, required: true },
  verificationTokens: [{ token: { type: String }, expiresAt: { type: Date } }],
  provider: {  type: String }
});

export const User = mongoose.model<IUser>("User", userSchema);