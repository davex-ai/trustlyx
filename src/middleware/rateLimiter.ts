import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { redis } from "../core/redis";

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 10, // limit each IP
  message: "Too many auth attempts, try again later",

  store: new RedisStore({
    sendCommand: (...args: string[]) => (redis as any).call(...args),
   }),
});