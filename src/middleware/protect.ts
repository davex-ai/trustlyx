import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../core/jwt";

export const protect = () => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const header = req.headers.authorization;

      if (!header) throw new Error("No token");

      const token = header.split(" ")[1];
      const decoded = verifyAccessToken(token);

      (req as any).user = decoded;

      next();
    } catch (err) {
      res.status(401).json({ message: "Unauthorized" });
    }
  };
};