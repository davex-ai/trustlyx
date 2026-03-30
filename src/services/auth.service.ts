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

    const hashed = await sdk.security.hashPassword(password);

    return User.create({
      email,
      password: hashed,
      tenantId,
      verified: false,
    });
  }

  async login(email: string, password: string) {
    const { tenantId, sdk } = this.ctx;
    const user = await User.findOne({ email, tenantId });
    if (!user) throw new Error("User not found");

    const valid = await sdk.security.comparePassword(
      password,
      user.password
    );

    if (!valid) throw new Error("Invalid credentials");

    if (!user.verified) throw new Error("Verify your email");

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