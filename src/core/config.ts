import { EmailAdapter, CacheAdapter } from "../adapters/types";
import { JWTService } from "./jwt";

export interface AuthConfig {
  mongoUri: string;
  jwtSecret: string;
  refreshSecret: string;
  appUrl: string

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


export class AuthSDK {
  public jwt: JWTService;

  constructor(private config: AuthConfig) {
    if (!config.jwtSecret || !config.refreshSecret) {
      throw new Error("Missing secrets");
    }

    this.jwt = new JWTService(
      config.jwtSecret,
      config.refreshSecret
    );
  }

  get appUrl() {
    return this.config.appUrl;
  }

  get emailAdapter() {
    return this.config.adapters?.email;
  }

  get cache() {
    return this.config.adapters?.cache;
  }

  get google() {
    return this.config.providers?.google;
  }
}