
import { CacheAdapter } from "./types";

const { cache } = config.adapters.cache
export class RedisAdapter implements CacheAdapter {
  async get(key: string) {
    return await cache.get(key);//cace is possible possible undefin..
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) {
      await cache.set(key, value, ttl);
    } else {
      await cache.set(key, value);
    }
  }

  async del(key: string) {
    await cache.del(key);
  }
}