import jwt from "jsonwebtoken";

export interface JWTPayload {
  id: string;
  role?: string;
  tenantId?: string;
}

export class JWTService {
  constructor(
    private jwtSecret: string,
    private refreshSecret: string
  ) {}

  signAccessToken(payload: JWTPayload) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: "15m" });
  }

  signRefreshToken(payload: JWTPayload) {
    return jwt.sign(payload, this.refreshSecret, { expiresIn: "7d" });
  }

  verifyAccessToken(token: string) {
    return jwt.verify(token, this.jwtSecret);
  }

  verifyRefreshToken(token: string) {
    return jwt.verify(token, this.refreshSecret);
  }
}