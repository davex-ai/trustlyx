import { CacheAdapter } from "./types";


export class RedisAdapter implements CacheAdapter {
  constructor(private client: any) {}

  async get(key: string) {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttl?: number) {
    if (ttl) return this.client.set(key, value, "EX", ttl);
    return this.client.set(key, value);
  }

  async del(key: string) {
    return this.client.del(key);
  }
}