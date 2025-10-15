// shared/config/redis.ts
import { createClient, RedisClientType } from "redis"

class RedisCache {
  private client: RedisClientType

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    }) as RedisClientType

    this.client.on("error", (err) => console.error("Redis Client Error", err))
    this.client.connect().catch(console.error)
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const val = await this.client.get(key)
    return val ? (typeof val === "string" ? JSON.parse(val) : null) : null
  }

  async set<T = unknown>(
    key: string,
    value: T,
    ttl: number = Number(process.env.CACHE_TTL_SECONDS) || 300,
  ): Promise<void> {
    await this.client.setEx(key, ttl, JSON.stringify(value))
  }

  async del(key: string): Promise<void> {
    await this.client.del(key)
  }

  async quit(): Promise<void> {
    await this.client.quit()
  }
}

const redisCache = new RedisCache()

export { redisCache }
