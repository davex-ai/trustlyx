import mongoose from "mongoose";
import { ISession, IUser } from "./types";

const sessionSchema = new mongoose.Schema<ISession>({
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true },
});

const userSchema = new mongoose.Schema<IUser>({
  email: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  verified: { type: Boolean, default: false },
  refreshTokens: [sessionSchema]
});

export const User = mongoose.model("User", userSchema);