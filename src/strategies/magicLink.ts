import crypto from "crypto";
import { AuthSDK } from "../core/config";
import { User } from "../models/user.model";
import { AuthContext } from "../core/context";


const hash = (t: string) =>
  crypto.createHash("sha256").update(t).digest("hex");

export const sendMagicLink = async (ctx: AuthContext, email: string) => {
  const raw = crypto.randomBytes(32).toString("hex");
  const { tenantId, sdk } = ctx;

  await User.findOneAndUpdate(
    { email, tenantId },
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

export const verifyMagicLink = async (ctx: AuthContext, token: string) => {
  const { tenantId, sdk } = ctx;
  const hashed = hash(token);

  const user = await User.findOne({
    tenantId,
    "verificationTokens.token": hashed,
  });

  if (!user) throw new Error("Invalid link");

  const record = user.verificationTokens.find(
    (t) => t.token === hashed
  );

  if (!record) throw new Error("Invalid link");

  if (new Date() > record.expiresAt) {
    throw new Error("Link expired");
  }

  user.verificationTokens = user.verificationTokens.filter(
    (t) => t.token !== hashed
  );

  user.verified = true;

  await user.save();

  const accessToken = sdk.jwt.signAccessToken({
    id: user._id.toString(),
    tenantId,
  });

  return { accessToken };
};