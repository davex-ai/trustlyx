import { AuthSDK } from "../core/config";

export class UserService {
  constructor(private sdk: AuthSDK) {}

  findById(id: string) {
    return this.sdk.userAdapter.findById(id);
  }

  findByEmail(email: string, tenantId: string) {
    return this.sdk.userAdapter.findByEmail( email, tenantId );
  }
}