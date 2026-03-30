import { AuthSDK } from "../core/config";
import { User } from "../models/user.model";


export class UserService {
  constructor(private sdk: AuthSDK) {}

  findById(id: string) {
    return User.findById(id);
  }

  findByEmail(email: string, tenantId: string) {
    return User.findOne({ email, tenantId });
  }
}