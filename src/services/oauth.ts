import axios from "axios";
import { AuthSDK } from "../core/config";
import { hashToken } from "../core/emailVerification";

export type OAuthProvider = "google" | "github";

interface NormalizedOAuthUser {
  email: string;
  name?: string;
  avatar?: string;
}

export class OAuthService {
  constructor(private sdk: AuthSDK) {}

  getAuthUrl(provider: OAuthProvider): string {
    if (provider === "google") return this.getGoogleAuthUrl();
    if (provider === "github") return this.getGithubAuthUrl();
    throw new Error(`Unsupported provider: ${provider}`);
  }

  private getGoogleAuthUrl(): string {
    const google = this.sdk.google;
    if (!google) throw new Error("Google not configured");
    const params = new URLSearchParams({
      client_id: google.clientId,
      redirect_uri: google.redirectUri,
      response_type: "code",
      scope: "openid email profile",
      access_type: "offline",
      prompt: "consent",
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  private getGithubAuthUrl(): string {
    const github = this.sdk.github;
    if (!github) throw new Error("GitHub not configured");
    const params = new URLSearchParams({
      client_id: github.clientId,
      redirect_uri: github.redirectUri,
      scope: "read:user user:email",
    });
    return `https://github.com/login/oauth/authorize?${params.toString()}`;
  }

  async getGoogleUser(code: string): Promise<NormalizedOAuthUser> {
    const google = this.sdk.google;
    if (!google) throw new Error("Google not configured");

    const tokenRes = await axios.post(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        code,
        client_id: google.clientId,
        client_secret: google.clientSecret,
        redirect_uri: google.redirectUri,
        grant_type: "authorization_code",
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const userRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      { headers: { Authorization: `Bearer ${tokenRes.data.access_token}` } }
    );

    return { email: userRes.data.email, name: userRes.data.name, avatar: userRes.data.picture };
  }

  async getGithubUser(code: string): Promise<NormalizedOAuthUser> {
    const github = this.sdk.github;
    if (!github) throw new Error("GitHub not configured");

    const tokenRes = await axios.post(
      "https://github.com/login/oauth/access_token",
      { code, client_id: github.clientId, client_secret: github.clientSecret, redirect_uri: github.redirectUri },
      { headers: { Accept: "application/json" } }
    );

    if (tokenRes.data.error) {
      throw new Error(tokenRes.data.error_description || "GitHub token exchange failed");
    }

    const accessToken = tokenRes.data.access_token;
    const userRes = await axios.get("https://api.github.com/user", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    let email = userRes.data.email;
    if (!email) {
      const emailsRes = await axios.get("https://api.github.com/user/emails", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const primary = emailsRes.data.find((e: any) => e.primary && e.verified);
      email = primary?.email;
    }
    if (!email) throw new Error("GitHub account has no accessible verified email");

    return { email, name: userRes.data.name || userRes.data.login, avatar: userRes.data.avatar_url };
  }

  async handleOAuthLogin(provider: OAuthProvider, code: string, tenantId: string) {
    const profile = provider === "google" ? await this.getGoogleUser(code) : await this.getGithubUser(code);

    let user = await this.sdk.userAdapter.findByEmail(profile.email, tenantId);
    if (!user) {
      user = await this.sdk.userAdapter.create({
        email: profile.email,
        tenantId,
        verified: true,
        provider,
      });
    }

    const accessToken = this.sdk.jwt.signAccessToken({ id: user.id, role: user.role, tenantId });
    const refreshToken = this.sdk.jwt.signRefreshToken({ id: user.id });

    await this.sdk.userAdapter.addSession(user.id, {
      token: hashToken(refreshToken),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 86400000),
      used: false,
    });

    return { accessToken, refreshToken, user };
  }
}