import crypto from "crypto"; 
import { User } from "../models/user.model";
import { AuthSDK } from "../core/config";
import { AuthContext } from "../core/context";

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export class AuthService {
  constructor(private ctx: AuthContext) {}

  async signup(email: string, password: string) {
  const { tenantId, sdk } = this.ctx;
  const existing = await User.findOne({ email, tenantId });
  if (existing) throw new Error("User already exists");

  const hashedPassword = await sdk.security.hashPassword(password);
  const rawToken = generateVerificationToken();

  const user = await User.create({
    email,
    password: hashedPassword,
    tenantId,
    verified: false,
    verificationTokens: [
      { token: hashToken(rawToken), expiresAt: new Date(Date.now() + 24 * 3600_000) },
    ],
  });

  await sdk.email?.sendEmail(
    email,
    "Verify your email",
    `<a href="${sdk.appUrl}/verify-email/${rawToken}">Verify your email</a>`
  );

  return user;
}

  async verifyEmail(token: string) {
  const { tenantId } = this.ctx;
  const hashed = hashToken(token);

  const user = await User.findOne({ tenantId, "verificationTokens.token": hashed });
  if (!user) throw new Error("Invalid or expired token");

  const record = user.verificationTokens.find(t => t.token === hashed);
  if (!record || new Date() > record.expiresAt) throw new Error("Invalid or expired token");

  user.verified = true;
  user.verificationTokens = user.verificationTokens.filter(t => t.token !== hashed);
  await user.save();

  return { verified: true };
  }

  async login(email: string, password: string) {
  const { tenantId, sdk } = this.ctx;

  if (await sdk.security.isLockedOut(email, tenantId)) {
    throw new Error("Too many failed attempts. Try again later.");
  }

  const user = await User.findOne({ email, tenantId });
  if (!user) {
    await sdk.security.recordFailedLogin(email, tenantId);
    throw new Error("Invalid credentials"); // same message as bad password — don't leak which one
  }

  const valid = await sdk.security.comparePassword(password, user.password);
  if (!valid) {
    await sdk.security.recordFailedLogin(email, tenantId);
    throw new Error("Invalid credentials");
  }

  if (!user.verified) throw new Error("Verify your email");

  await sdk.security.resetFailedLogin(email, tenantId);

    const accessToken = sdk.jwt.signAccessToken({
      id: user._id.toString(),
      role: user.role,
      tenantId
    });

    const refreshToken = sdk.jwt.signRefreshToken({
      id: user._id.toString(),
    });

    const hashed = hashToken(refreshToken);

    user.refreshTokens.push({
      token: hashed,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400000),
      used: false
    });

    await user.save();

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const { sdk } = this.ctx;
    const decoded: any = sdk.jwt.verifyRefreshToken(refreshToken);

    const user = await User.findById(decoded.id);
    if (!user) throw new Error("User not found");

    const hashed = hashToken(refreshToken);

    const session = user.refreshTokens.find(t => t.token === hashed);
    if (!session) throw new Error("Invalid session");

    return {
      accessToken: sdk.jwt.signAccessToken({
        id: user._id.toString(),
        role: user.role,
      }),
    };
  }
}