import { EmailAdapter, CacheAdapter } from "../adapters/types";

export interface AuthConfig {
  mongoUri: string;
  jwtSecret: string;
  refreshSecret: string;

  adapters?: {
    email?: EmailAdapter;
    cache?: CacheAdapter;
  };
  providers?: {
    google?: {
      clientId: string;
      clientSecret: string;
      redirectUri: string;
    };
  }
}

let config: AuthConfig;

export const setConfig = (cfg: AuthConfig) => {
  config = cfg;
};

export const getConfig = () => {
  if (!config) throw new Error("Auth SDK not initialized");
  return config;
};