import { AuthSDK } from "../core/config";
import { User } from "../models/user.model";

export const handleGoogleAuth = async (
  sdk: AuthSDK,
  code: string,
  tenantId: string
) => {
  const googleUser = await sdk.oauth.getGoogleUser(code);

  let user = await User.findOne({
    provider: "google",
    email: googleUser.email,
    tenantId
  });

  if (!user) {
    user = await User.create({
      email: googleUser.email,
      tenantId,
      verified: true,
      provider: "google",
    });
  }

  const accessToken = sdk.jwt.signAccessToken({
    id: user._id.toString(),
  });

  return { accessToken };
};