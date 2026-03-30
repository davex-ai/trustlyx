import axios from "axios";
import { AuthSDK } from "../core/config";

export const getGoogleUser = async (sdk: AuthSDK, code: string) => {
  const google = sdk.google;
  if (!google) throw new Error("Google provider not configured");

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
};

export const getGoogleAuthUrl = (sdk: AuthSDK) => {
  const google = sdk.google;
  if (!google) throw new Error("Google not configured");

  const params = new URLSearchParams({
    client_id: google.clientId,
    redirect_uri: google.redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
    prompt: "consent",
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
};