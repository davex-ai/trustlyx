import mongoose from "mongoose";
import { IUser } from "./user.types";

const userSchema = new mongoose.Schema<IUser>({
  email: { type: String, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "user" },
  verified: { type: Boolean, default: false },
});

export const User = mongoose.model("User", userSchema);