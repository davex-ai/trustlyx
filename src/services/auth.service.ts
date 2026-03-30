import { User } from "../models/user.model";
import { hashPassword, comparePassword } from "../core/password";
import { isLockedOut, recordFailedLogin, resetFailedLogin } from "../core/bruteforce";
import { generateVerificationToken, hashToken } from "../core/emailVerification";
import { getGoogleUser } from "./google";
import { AuthSDK } from "../core/config";

export const signup = async (email: string, password: string, tenantId: string) => {
  const existing = await User.findOne({ email, tenantId });
  if (existing) throw new Error("User already exists");

  const hashed = await hashPassword(password);

  const rawToken = generateVerificationToken()
  const hashedToken = hashToken(rawToken);

  const user = await User.create({
    email,
    password: hashed,
    tenantId,
    verificationTokens: [{ token: hashedToken, expiresAt: new Date(Date.now() + 15 * 60 * 1000) }]
});

  return user;
};

export const login = async (sdk: AuthSDK, email: string, password: string, tenantId: string) => {
    if (await isLockedOut(email, tenantId)) throw new Error("Account locked due to too many failed attempts");
  const user = await User.findOne({ email, tenantId });
  if (!user) {await recordFailedLogin(email, tenantId); throw new Error("User not found")};

  const valid = await comparePassword(password, user.password);
  if (!valid) {await recordFailedLogin(email, tenantId); throw new Error("Invalid credentials")};
  await resetFailedLogin(email, tenantId);

  const accessToken = sdk.jwt.signAccessToken({
    id: user._id.toString(),
    role: user.role,
  });

  if (!user.verified) {
  throw new Error("Please verify your email");
}

  const refreshToken = sdk.jwt.signRefreshToken({
    id: user._id.toString(),
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

export const handleGoogleAuth = async (sdk: AuthSDK, code: string, tenantId: string) => {
  const googleUser = await getGoogleUser(sdk, code);

  let user = await User.findOne({ provider: "google", providerId: googleUser.id });

  if (!user) {
    user = await User.create({
      email: googleUser.email,
      tenantId,
      verified: true,
      provider: "google"
    });
  }

  const accessToken = sdk.jwt.signAccessToken({
    id: user._id.toString(),
    role: user.role,
  });

  const refreshToken = sdk.jwt.signRefreshToken({
    id: user._id.toString(),
  });

  const hashedRefreshToken = hashToken(refreshToken);

  user.refreshTokens.push({
    token: hashedRefreshToken,
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

await user.save();

  return { accessToken, refreshToken };
};