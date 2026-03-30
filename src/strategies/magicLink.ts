import crypto from "crypto";
import { AuthSDK } from "../core/AuthSDK";
import { User } from "../models/User";

const hash = (t: string) =>
  crypto.createHash("sha256").update(t).digest("hex");

export const sendMagicLink = async (sdk: AuthSDK, email: string) => {
  const raw = crypto.randomBytes(32).toString("hex");

  await User.findOneAndUpdate(
    { email },
    {
      $push: {
        verificationTokens: {
          token: hash(raw),
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      },
    },
    { upsert: true }
  );

  await sdk.email?.sendEmail(
    email,
    "Magic Link",
    `<a href="${sdk.appUrl}/magic/${raw}">Login</a>`
  );
};

export const verifyMagicLink = async (sdk: AuthSDK, token: string) => {
  const hashed = hash(token);

  const user = await User.findOne({
    "verificationTokens.token": hashed,
  });

  if (!user) throw new Error("Invalid link");

  const accessToken = sdk.jwt.signAccessToken({
    id: user._id.toString(),
  });

  return { accessToken };
};