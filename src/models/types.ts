import { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  role: "user" | "admin";
  verified: boolean;
  refreshTokens: ISession[];
  verificationTokens: string[];

}
export interface ISession {
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

