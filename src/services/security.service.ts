import bcrypt from "bcrypt";
import { AuthSDK } from "../core/config";

const PREFIX = "login_fail:";
export class SecurityService {
  constructor(private sdk: AuthSDK) {}

  hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  comparePassword(password: string, hash: string) {
    return bcrypt.compare(password, hash);
  } 
  async recordFailedLogin(email: string, tenantId: string) {
      const key = PREFIX + `${tenantId}:${email}`;
  
      const attempts = Number((await this.sdk.cache?.get(key)) || 0) + 1;
  
      await this.sdk.cache?.set(key, String(attempts), 900); // 15 mins
  
      return attempts;
    }
  
    async isLockedOut(email: string, tenantId: string) {
      const attempts = await this.sdk.cache?.get(
        PREFIX + `${tenantId}:${email}`
      );
  
      return Number(attempts) >= 5;
    }
  
    async resetFailedLogin(email: string, tenantId: string) {
      await this.sdk.cache?.del(PREFIX + `${tenantId}:${email}`);
    }
}