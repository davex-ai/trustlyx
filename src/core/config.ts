import { EmailAdapter, CacheAdapter } from "../adapters/types";
import { JWTService } from "./JWTService";
import { AuthService } from "../services/AuthService";
import { OAuthService } from "../services/OAuthService";
import { SecurityService } from "../services/SecurityService";
import { UserService } from "../services/UserService";

export interface AuthConfig {
  jwtSecret: string;
  refreshSecret: string;
  appUrl: string;

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
  };
}

export class AuthSDK {
  public jwt: JWTService;
  public auth: AuthService;
  public oauth: OAuthService;
  public security: SecurityService;
  public users: UserService;

  constructor(private config: AuthConfig) {
    this.jwt = new JWTService(config.jwtSecret, config.refreshSecret);

    this.security = new SecurityService(this);
    this.users = new UserService(this);
    this.oauth = new OAuthService(this);
    this.auth = new AuthService(this);
  }

  get appUrl() {
    return this.config.appUrl;
  }

  get email() {
    return this.config.adapters?.email;
  }

  get cache() {
    return this.config.adapters?.cache;
  }

  get google() {
    return this.config.providers?.google;
  }
}