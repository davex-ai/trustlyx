import axios from "axios";
import { OAuthProviderHandler } from "services/oauth";


export class GoogleProvider implements OAuthProviderHandler {
  constructor(private config: { clientId: string; clientSecret: string; redirectUri: string }) {}
  getAuthUrl() { 
     const google = this.config;
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
  async getUser(code: string) { 

      const google = this.config;
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
}