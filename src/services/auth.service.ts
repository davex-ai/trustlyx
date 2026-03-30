import { User } from "../models/user.model";
import { hashPassword, comparePassword } from "../core/password";
import { signAccessToken, signRefreshToken } from "../core/jwt";
import { isLockedOut, recordFailedLogin, resetFailedLogin } from "../core/bruteforce";
import { generateVerificationToken, hashToken } from "../core/emailVerification";
import { getAdapters } from "../../helpers";
import { getGoogleUser } from "./google";

export const signup = async (email: string, password: string, tenantId: string) => {
  const existing = await User.findOne({ email, tenantId });
  if (existing) throw new Error("User already exists");

  const hashed = await hashPassword(password);

  const rawToken = generateVerificationToken()
  const hashedToken = hashToken(rawToken);

  const user = await User.create({
    email,
    password: hashed,
    verificationTokens: [{ token: hashedToken, expiresAt: new Date(Date.now() + 15 * 60 * 1000) }]
});

const { email: emailAdapter } = getAdapters();

await emailAdapter?.sendEmail(
    user.email, "Verify your email", `<p>Click <a href="http://localhost:3000/verify/${rawToken}">here</a> to verify your email.</p>`
);


  return user;
};

export const login = async (email: string, password: string, tenantId: string) => {
    if (await isLockedOut(email)) throw new Error("Account locked due to too many failed attempts");
  const user = await User.findOne({ email, tenantId });
  if (!user) {await recordFailedLogin(email); throw new Error("User not found")};

  const valid = await comparePassword(password, user.password);
  if (!valid) {await recordFailedLogin(email); throw new Error("Invalid credentials")};
  await resetFailedLogin(email);

  const accessToken = signAccessToken({
    id: user._id,
    role: user.role,
  });

  if (!user.verified) {
  throw new Error("Please verify your email");
}

  const refreshToken = signRefreshToken({
    id: user._id,
  });
  const hashedRefreshToken = hashToken(refreshToken);

  user.refreshTokens.push({
    token: hashedRefreshToken,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await user.save();

    const safeUser = {
    id: user._id,
    email: user.email,
    role: user.role,
    verified: user.verified
    };
  return { accessToken, refreshToken, user: safeUser };
};

export const handleGoogleAuth = async (code: string, tenantId: string) => {
  const googleUser = await getGoogleUser(code);

  let user = await User.findOne({ email: googleUser.email, tenantId });

  if (!user) {
    user = await User.create({
      email: googleUser.email,
      tenantId,
      verified: true,
    });
  }

  const accessToken = signAccessToken({
    id: user._id,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    id: user._id,
  });

  return { accessToken, refreshToken };
};