import { CacheAdapter } from "./types";

export class RedisAdapter implements CacheAdapter {
  constructor(private cache: any) {
    if (!cache) throw new Error("Cache not configured");
  }

  async get(key: string) {
    return this.cache.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    return ttl
      ? this.cache.set(key, value, ttl)
      : this.cache.set(key, value);
  }

  async del(key: string) {
    return this.cache.del(key);
  }
}
