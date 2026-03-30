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
  user.verificationTokens = [];

  user.verificationTokens.push({ token: hashed, expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
  await user.save();

  const { email: emailAdapter } = getAdapters();

  await emailAdapter?.sendEmail(
    email,
    "Your magic login link",
    `<a href="http://localhost:3000/magic/${rawToken}">Login</a>`
  );
};

export const verifyMagicLink = async (token: string) => {
  const hashed = hashToken(token);

  const user = await User.findOne({
    "verificationTokens.token": hashed,
});

if (!user) throw new Error("Invalid link");
const record = user!.verificationTokens.find(
(t) => t.token === hashed
);

if (!record) throw new Error("Invalid link");

if (new Date() > record.expiresAt) {
  throw new Error("Link expired");
}

  user.verificationTokens = user.verificationTokens.filter(
    (t) => t.token !== hashed
  );

  await user.save();
  const accessToken = signAccessToken({
    id: user._id,
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    id: user._id,
  });

  return { accessToken, refreshToken };
};