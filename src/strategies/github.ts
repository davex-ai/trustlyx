import axios from "axios";
import { OAuthProviderHandler } from "services/provider.interface";

export class GithubProvider implements OAuthProviderHandler {
  constructor(private config: { clientId: string; clientSecret: string; redirectUri: string }) {}
  getAuthUrl() {
    
        const github = this.config;
        if (!github) throw new Error("GitHub not configured");
        const params = new URLSearchParams({
          client_id: github.clientId,
          redirect_uri: github.redirectUri,
          scope: "read:user user:email",
        });
        return `https://github.com/login/oauth/authorize?${params.toString()}`;
      
  }
  async getUser(code: string) {
    
    const github = this.config;
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
}