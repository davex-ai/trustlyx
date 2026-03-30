export interface EmailAdapter {
  sendEmail(to: string, subject: string, html: string): Promise<void>;
}

export interface CacheAdapter {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
}