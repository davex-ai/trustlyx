import { getAdapters } from "../../helpers";
import { redis } from "./redis";
const { cache } = getAdapters();

const PREFIX = "login_fail:";

export const recordFailedLogin = async (email: string, tenantId: string) => {
  const key = PREFIX + `${tenantId}:${email}`;

  const attempts = await redis.incr(key);

  if (attempts === 1) {
    await redis.expire(key, 60 * 15); // 15 min window
  }

  return attempts;
};

export const isLockedOut = async (email: string, tenantId: string) => {
  const attempts = await cache?.get(PREFIX + `${tenantId}:${email}`);

  return Number(attempts) >= 5;
};

export const resetFailedLogin = async (email: string, tenantId: string) => {
  await redis.del(PREFIX + `${tenantId}:${email}`);
};