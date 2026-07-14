import { AuthContext } from "../core/context";
import { generateVerificationToken, hashToken } from "core/emailVerification";

export const sendMagicLink = async (ctx: AuthContext, email: string) => {
  const { tenantId, sdk } = ctx;
  const raw = generateVerificationToken();

  let user = await sdk.userAdapter.findByEmail(email, tenantId);
  if (!user) {
    user = await sdk.userAdapter.create({ email, tenantId, verified: false });
    try {
    sdk.hooks?.onUserCreated?.(user);
  } catch (err) {
    console.error("onUserCreated hook threw:", err);
  }
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

  const accessToken = sdk.jwt.signAccessToken({ id: user.id, role: user.role, tenantId });
  const refreshToken = sdk.jwt.signRefreshToken({ id: user.id });

  await sdk.userAdapter.addSession(user.id, {
    token: hashToken(refreshToken),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 86400000),
    used: false,
  });

  try {
  sdk.hooks?.onLogin?.(user);
} catch (err) {
  console.error("onLogin hook threw:", err);
}

  return { accessToken, refreshToken };
};