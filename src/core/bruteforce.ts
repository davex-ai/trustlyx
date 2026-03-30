import { redis } from "./redis";

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
  const attempts = await redis.get(PREFIX + email);

  return Number(attempts) >= 5;
};

export const resetFailedLogin = async (email: string) => {
  await redis.del(PREFIX + email);
};