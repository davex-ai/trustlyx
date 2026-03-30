import jwt from "jsonwebtoken";

export class JWTService {
  constructor(
    private jwtSecret: string,
    private refreshSecret: string
  ) {}

  signAccessToken(payload: any) {
    return jwt.sign(payload, this.jwtSecret, { expiresIn: "15m" });
  }

  signRefreshToken(payload: any) {
    return jwt.sign(payload, this.refreshSecret, { expiresIn: "7d" });
  }

  verifyAccessToken(token: string) {
    return jwt.verify(token, this.jwtSecret);
  }

  verifyRefreshToken(token: string) {
    return jwt.verify(token, this.refreshSecret);
  }
}