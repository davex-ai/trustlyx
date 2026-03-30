import mongoose from "mongoose";
import { setConfig, AuthConfig } from "./core/config";
import { protect } from "./middleware/protect";
import { signup, login } from "./services/auth.service";

export const createAuth = (config: AuthConfig) => {
  setConfig(config);

  mongoose.connect(config.mongoUri);

  return {
    signup,
    login,
    protect,
  };
};