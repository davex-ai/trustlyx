import { AuthSDK } from "./config";

export class AuthContext {
  constructor(public sdk: AuthSDK, public tenantId: string) {}
}