import { EmailAdapter, CacheAdapter } from "../adapters/types";

export interface AuthConfig {
  mongoUri: string;
  jwtSecret: string;
  refreshSecret: string;

  getTenant?: (req: any) => string

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


export const createAuth = (config: AuthConfig) => {
  if (!config) throw new Error("Auth SDK not initialized");
  const emailAdapter = config.adapters?.email;
  const cache = config.adapters?.cache;
  const appUrl = config.appUrl//appurl dosnt exist

    if (!config.jwtSecret || !config.refreshSecret) throw new Error("Missing secrets");
  return config;
};