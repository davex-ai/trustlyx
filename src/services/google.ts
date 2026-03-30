import axios from "axios";
import { getConfig } from "../core/config";

export const getGoogleUser = async (code: string) => {
    const google = getConfig().providers?.google
    if(!google) throw new Error("Google provider not configured");
  const { clientId, clientSecret, redirectUri } = google;

  const tokenRes = await axios.post(
    "https://oauth2.googleapis.com/token",
    {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }
  );

  const { access_token } = tokenRes.data;

  const userRes = await axios.get(
    "https://www.googleapis.com/oauth2/v2/userinfo",
    {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    }
  );

  return userRes.data;
};