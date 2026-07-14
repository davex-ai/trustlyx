import crypto from "crypto";
import { AuthSDK } from "../core/config";
import { User } from "../models/user.model";
import { AuthContext } from "../core/context";
import { generateVerificationToken, hashToken } from "core/emailVerification";


const hash = (t: string) =>
  crypto.createHash("sha256").update(t).digest("hex");

export const sendMagicLink = async (ctx: AuthContext, email: string) => {
  const { tenantId, sdk } = ctx;
  const raw = generateVerificationToken();

  let user = await sdk.userAdapter.findByEmail(email, tenantId);

  if (!user) {
    user = await sdk.userAdapter.create({
      email,
      tenantId,
      verified: false,
    });
  }

  await sdk.userAdapter.addVerificationToken(user.id, {
    token: hashToken(raw),
    expiresAt: new Date(Date.now() + 15 * 60 * 1000),
  });

  await sdk.email?.sendEmail(
    email,
    "Magic Link",
    `<a href="${sdk.appUrl}/magic/${raw}">Login</a>`
  );
};

export const verifyMagicLink = async (ctx: AuthContext, token: string) => {
  const { tenantId, sdk } = ctx;
  const hashed = hashToken(token);

  const user = await sdk.userAdapter.findByVerificationToken(hashed, tenantId);
  if (!user) throw new Error("Invalid link");

  const record = (user.verificationTokens || []).find((t: any) => t.token === hashed);
  if (!record) throw new Error("Invalid link");
  if (new Date() > new Date(record.expiresAt)) throw new Error("Link expired");

  await sdk.userAdapter.removeVerificationToken(user.id, hashed);
  await sdk.userAdapter.update(user.id, { verified: true });

  const accessToken = sdk.jwt.signAccessToken({
    id: user.id,
    tenantId,
  });

  return { accessToken };
};