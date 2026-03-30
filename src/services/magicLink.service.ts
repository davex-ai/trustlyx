import crypto from "crypto";
import { getAdapters } from "../../helpers";
import { User } from "../models/user.model";
import { signAccessToken, signRefreshToken } from "../core/jwt";
import { generateVerificationToken } from "../core/emailVerification";

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const sendMagicLink = async (email: string) => {
  let user = await User.findOne({ email });

  if (!user) {
    user = await User.create({ email, verified: true });
  }

  const rawToken = generateVerificationToken();
  const hashed = hashToken(rawToken);

  user.verificationTokens.push(hashed);
  await user.save();

  const { userEmail: emailAdapter } = getAdapters();

  await emailAdapter?.sendEmail(
    email,
    "Your magic login link",
    `<a href="http://localhost:3000/magic/${rawToken}">Login</a>`
  );
};

export const verifyMagicLink = async (token: string) => {
  const hashed = hashToken(token);

  const user = await User.findOne({
    verificationTokens: hashed,
  });

  if (!user) throw new Error("Invalid link");

  const accessToken = signAccessToken({
    id: user._id,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    id: user._id,
  });

  return { accessToken, refreshToken };
};