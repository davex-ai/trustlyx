
import { CacheAdapter } from "./types";
import { redis } from "../core/redis";

export class RedisAdapter implements CacheAdapter {
  async get(key: string) {
    return await redis.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await redis.set(key, value, "EX", ttl);
    } else {
      await redis.set(key, value);
    }
  }

  async del(key: string) {
    await redis.del(key);
  }
}