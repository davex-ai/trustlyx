import { Request, Response, NextFunction } from "express";
import { AuthSDK } from "./../core/config";

export const protect = (sdk: AuthSDK) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;

      if (!header) throw new Error("No token");

      const token = header.split(" ")[1];
      const decoded = sdk.jwt.verifyAccessToken(token);

      (req as any).user = decoded;

      next();
    } catch (err) {
      res.status(401).json({ message: "Unauthorized" });
    }
  };
};
