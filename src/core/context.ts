import { AuthService } from "../services/auth.service";
import { AuthSDK } from "./config";

export class AuthContext {
  constructor(public sdk: AuthSDK, public tenantId: string) {}

  get auth(){ return new AuthService(this)}
}