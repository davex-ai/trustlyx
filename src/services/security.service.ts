import { AuthSDK } from "../core/config";
import bcrypt from "bcrypt";

export class SecurityService {
  constructor(private sdk: AuthSDK) {}

  hashPassword(pw: string) {
    return bcrypt.hash(pw, 10);
  }

  comparePassword(pw: string, hash: string) {
    return bcrypt.compare(pw, hash);
  }
}
