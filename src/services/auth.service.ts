import crypto from "crypto"; 
import { AuthSDK } from "../core/config";
import { AuthContext } from "../core/context";
import { generateVerificationToken, hashToken } from "core/emailVerification";

export class AuthService {

  constructor ( private ctx: AuthContext ){}

  async signup(email: string, password: string) {
  const { tenantId, sdk } = this.ctx;
  const existing = await sdk.userAdapter.findByEmail(email, tenantId);
  if (existing) throw new Error("User already exists");

  const hashedPassword = await sdk.security.hashPassword(password);
  const rawToken = generateVerificationToken();

  const user = await sdk.userAdapter.create({
    email,
    password: hashedPassword,
    tenantId,
    verified: false,
  });

  await sdk.userAdapter.addVerificationToken(user.id, {
    token: hashToken(rawToken),
    expiresAt: new Date(Date.now() + 24 * 3600_000),
  });

  await sdk.email?.sendEmail(
    email,
    "Verify your email",
    `<a href="${sdk.appUrl}/verify-email/${rawToken}">Verify your email</a>`
  );
  try {
    sdk.hooks?.onUserCreated?.(user);
  } catch (err) {
    console.error("onUserCreated hook threw:", err);
  }
  return user;
}

async verifyEmail(token: string) {
  const { tenantId, sdk } = this.ctx;
  const hashed = hashToken(token);

  const user = await sdk.userAdapter.findByVerificationToken(hashed, tenantId);
  if (!user) throw new Error("Invalid or expired token");

  const record = (user.verificationTokens || []).find((t: any) => t.token === hashed);
  if (!record || new Date() > new Date(record.expiresAt)) throw new Error("Invalid or expired token");

  const userId = user.id;
  await sdk.userAdapter.update(userId, { verified: true });
  await sdk.userAdapter.removeVerificationToken(userId, hashed);

  return { verified: true };
}

async login(email: string, password: string) {
  const { tenantId, sdk } = this.ctx;

  if (await sdk.security.isLockedOut(email, tenantId)) {
    throw new Error("Too many failed attempts. Try again later.");
  }

  const user = await sdk.userAdapter.findByEmail(email, tenantId);
  if (!user) {
    await sdk.security.recordFailedLogin(email, tenantId);
    throw new Error("Invalid credentials");
  }

  const valid = await sdk.security.comparePassword(password, user.password);
  if (!valid) {
    await sdk.security.recordFailedLogin(email, tenantId);
    throw new Error("Invalid credentials");
  }

  if (!user.verified) throw new Error("Verify your email");

  await sdk.security.resetFailedLogin(email, tenantId);

  const userId = user.id;
  const accessToken = sdk.jwt.signAccessToken({ id: userId, role: user.role, tenantId });
  const refreshToken = sdk.jwt.signRefreshToken({ id: userId });

  await sdk.userAdapter.addSession(userId, {
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
}

async refresh(refreshToken: string) {
  const { sdk, tenantId } = this.ctx;
  const decoded: any = sdk.jwt.verifyRefreshToken(refreshToken);

  const user = await sdk.userAdapter.findById(decoded.id);
  if (!user) throw new Error("User not found");

  const hashed = hashToken(refreshToken);
  const session = await sdk.userAdapter.findSession(decoded.id, hashed);

  if (!session || session.used) throw new Error("Invalid session");
  if (new Date() > new Date(session.expiresAt)) throw new Error("Session expired");

  await sdk.userAdapter.markSessionUsed(decoded.id, hashed);

  const newRefreshToken = sdk.jwt.signRefreshToken({ id: decoded.id });
  await sdk.userAdapter.addSession(decoded.id, {
    token: hashToken(newRefreshToken),
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 7 * 86400000),
    used: false,
  });

  const accessToken = sdk.jwt.signAccessToken({ id: decoded.id, role: user.role, tenantId });

  return { accessToken, refreshToken: newRefreshToken };
}
}