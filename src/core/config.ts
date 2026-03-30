import { CacheAdapter, EmailAdapter } from "../adapters/types";
import { AuthService } from "../services/auth.service";
import { OAuthService } from "../services/oauth";
import { SecurityService } from "../services/security.service";
import { UserService } from "../services/user.service";
import { JWTService } from "../core/jwt";
import { AuthContext } from "./context";

export interface AuthConfig {
  jwtSecret: string;
  refreshSecret: string;
  appUrl: string;

  adapters?: {
    email?: EmailAdapter;
    cache?: CacheAdapter;
  };

  getTenant?: (req: any) => string
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
  public oauth: OAuthService;
  public security: SecurityService;
  public users: UserService;
  createContext(req: any) {
    const tenantId = this.getTenant(req);
    return new AuthContext(this, tenantId);
  }
  constructor(private config: AuthConfig) {
    this.jwt = new JWTService(config.jwtSecret, config.refreshSecret);

    this.security = new SecurityService(this);
    this.users = new UserService(this);
    this.oauth = new OAuthService(this);
    
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

  getTenant(req?: any): string {
  if (!this.config.getTenant) {
    throw new Error("Tenant resolver not configured");
  }

  const tenant = this.config.getTenant(req);

  if (!tenant) {
    throw new Error("Tenant not resolved");
  }

  return tenant;
}
}