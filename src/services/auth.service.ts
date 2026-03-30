import { User } from "../models/user.model";
import { hashPassword, comparePassword } from "../core/password";
import { signAccessToken, signRefreshToken } from "../core/jwt";
import { isLockedOut, recordFailedLogin, resetFailedLogin } from "../core/bruteforce";
import { generateVerificationToken, hashToken } from "../core/emailVerification";
import { getAdapters } from "../../helpers";

export const signup = async (email: string, password: string) => {
  const existing = await User.findOne({ email });
  if (existing) throw new Error("User already exists");

  const hashed = await hashPassword(password);

  const rawToken = generateVerificationToken()
  const hashedToken = hashToken(rawToken);

  const user = await User.create({
    email,
    password: hashed,
    verificationTokens: [hashedToken]
});

//TODO: SMTP/RESEND
const { userEmail } = getAdapters();

await userEmail?.sendEmail(
    user.email, "Verify your email", `<p>Click <a href="http://localhost:3000/verify/${rawToken}">here</a> to verify your email.</p>`
);


  return user;
};

export const login = async (email: string, password: string) => {
    if (await isLockedOut(email)) throw new Error("Account locked due to too many failed attempts");
  const user = await User.findOne({ email });
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