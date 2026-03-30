import { Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  password: string;
  role: "user" | "admin";
  verified: boolean;
  refreshTokens: ISession[];
  tenantId: string;
  verificationTokens: IVerificationToken[]
}
export interface ISession {
  token: string;
  createdAt: Date;
  expiresAt: Date;
}

export interface IVerificationToken {
  token: string;
  expiresAt: Date;
}
