import axios from "axios";
import { AuthSDK } from "../core/config";

export class OAuthService {
  constructor(private sdk: AuthSDK) {}

  async getGoogleUser(code: string) {
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

    const accessToken = tokenRes.data.access_token;

    const userRes = await axios.get(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    return userRes.data;
  }
}