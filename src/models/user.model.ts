import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: "user" },
  verified: { type: Boolean, default: false },
});

export const User = mongoose.model("User", userSchema);