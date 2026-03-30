import { User } from "../models/user.model";
import { hashPassword, comparePassword } from "../core/password";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../core/jwt";

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

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new Error("Invalid credentials");

  const accessToken = signAccessToken({
    id: user._id,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    id: user._id,
  });

  user.refreshTokens.push({//argument of type '{ token...}
    token: refreshToken,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await user.save();
    const safeUser = {
    id: user._id,
    email: user.email,
    role: user.role,
    verified: user.verified,
    };
  return { accessToken, refreshToken, user };
};