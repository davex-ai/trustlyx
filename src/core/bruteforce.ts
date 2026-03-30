import { getAdapters } from "../../helpers";
import { redis } from "./redis";
const { cache } = getAdapters();

const PREFIX = "login_fail:";

export const recordFailedLogin = async (email: string) => {
  const key = PREFIX + email;

  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 60 * 15); // 15 min window
  }

  return attempts;
};

export const isLockedOut = async (email: string) => {
  const attempts = await cache?.get(PREFIX + email);

  return Number(attempts) >= 5;
};

export const resetFailedLogin = async (email: string) => {
  await redis.del(PREFIX + email);
};