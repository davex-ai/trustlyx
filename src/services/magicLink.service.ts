import crypto from "crypto";
import { getAdapters } from "../../helpers";
import { User } from "../models/user.model";
import { generateVerificationToken } from "../core/emailVerification";
import { AuthSDK } from "../core/config";

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const sendMagicLink = async (sdk: AuthSDK, email: string) => {
  const rawToken = crypto.randomBytes(32).toString("hex");

  const hashed = crypto
    .createHash("sha256")
    .update(rawToken)
    .digest("hex");

  const user = await User.findOneAndUpdate(
    { email },
    {
      $push: {
        verificationTokens: {
          token: hashed,
          expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        },
      },
    },
    { upsert: true, new: true }
  );

  await sdk.emailAdapter?.sendEmail(//doesnt exist
    email,
    "Magic Link",
    `<a href="${sdk.appUrl}/magic/${rawToken}">Login</a>`
  );
};

export const verifyMagicLink = async (sdk: AuthSDK, token: string) => {
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
  const accessToken = sdk.jwt.signAccessToken({
    id: user._id.toString(),
    role: user.role,
  });

  const refreshToken = sdk.jwt.signRefreshToken({
    id: user._id.toString(),
  });

  return { accessToken, refreshToken };
};