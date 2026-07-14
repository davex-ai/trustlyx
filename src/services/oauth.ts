import { AuthSDK } from "../core/config";
import { hashToken } from "../core/emailVerification";
import { GithubProvider } from "strategies/github";
import { GoogleProvider } from "strategies/google";
import { OAuthProvider, OAuthProviderHandler } from "./provider.interface";

export class OAuthService {
  constructor(private sdk: AuthSDK) { }

  private getProvider(name: OAuthProvider): OAuthProviderHandler {
    if (name === "google") {
      if (!this.sdk.google) throw new Error("Google not configured");
      return new GoogleProvider(this.sdk.google);
    }
    if (name === "github") {
      if (!this.sdk.github) throw new Error("GitHub not configured");
      return new GithubProvider(this.sdk.github);
    }
    throw new Error(`Unsupported provider: ${name}`);
  }

  getAuthUrl(provider: OAuthProvider) {
    return this.getProvider(provider).getAuthUrl();
  }

  async handleOAuthLogin(provider: OAuthProvider, code: string, tenantId: string) {
    const profile = await this.getProvider(provider).getUser(code);

    let user = await this.sdk.userAdapter.findByEmail(profile.email, tenantId);
    if (!user) {
      user = await this.sdk.userAdapter.create({
        email: profile.email,
        tenantId,
        verified: true,
        provider,
      });
      try {
        this.sdk.hooks?.onUserCreated?.(user);
      } catch (err) {
        console.error("onUserCreated hook threw:", err);
      }
    }

    const accessToken = this.sdk.jwt.signAccessToken({ id: user.id, role: user.role, tenantId });
    const refreshToken = this.sdk.jwt.signRefreshToken({ id: user.id });

    await this.sdk.userAdapter.addSession(user.id, {
      token: hashToken(refreshToken),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400000),
      used: false,
    });
    try {
      this.sdk.hooks?.onLogin?.(user);
    } catch (err) {
      console.error("onLogin hook threw:", err);
    }

    return { accessToken, refreshToken, user };

  }
}