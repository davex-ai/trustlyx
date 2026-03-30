import { User } from "../models/user.model";
import { hashPassword, comparePassword } from "../core/password";
import { signToken } from "../core/jwt";

export const signup = async (email: string, password: string) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("User already exists");

  const hashed = await hashPassword(password);

  const user = await User.create({
    email,
    password: hashed,
  });

  return user;
};

export const login = async (email: string, password: string) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  const valid = await comparePassword(password, user.password);//argument of type 'string | null |....
  if (!valid) throw new Error("Invalid credentials");

  const token = signToken({
    id: user._id,
    role: user.role,
  });

  return { token, user };
};