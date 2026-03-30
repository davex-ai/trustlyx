import mongoose from "mongoose";
import { setConfig, AuthConfig } from "./core/config";
import { protect } from "./middleware/protect";
import { signup, login, handleGoogleAuth } from "./services/auth.service";
import { getGoogleAuthUrl } from "./services/google";

export const createAuth = (config: AuthConfig) => {
  setConfig(config);

  mongoose.connect(config.mongoUri);

  return {
    signup,
    login,
    protect,

    oauth: {
      google: {
        getAuthUrl: getGoogleAuthUrl,
        callback: handleGoogleAuth
      }
    }
  };
};