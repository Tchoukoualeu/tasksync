// shared/config/redisPublisher.ts
import { createClient, RedisClientType } from "redis"

class RedisPublisher {
  private client: RedisClientType | null = null
  private connecting: Promise<void> | null = null

  private async ensureConnected(): Promise<void> {
    if (this.client?.isReady) {
      return
    }

    if (this.connecting) {
      return this.connecting
    }

    this.connecting = (async () => {
      try {
        this.client = createClient({
          url: process.env.REDIS_URL || "redis://localhost:6379",
        }) as RedisClientType

        this.client.on("error", (err) =>
          console.error("Redis Publisher Error", err),
        )

        await this.client.connect()
        console.log("✅ Redis publisher connected")
      } catch (err) {
        console.error("❌ Failed to connect Redis publisher:", err)
        this.client = null
        throw err
      } finally {
        this.connecting = null
      }
    })()

    return this.connecting
  }

  async publish(channel: string, message: any): Promise<void> {
    try {
      await this.ensureConnected()
      if (!this.client) {
        throw new Error("Redis client not initialized")
      }

      const payload =
        typeof message === "string" ? message : JSON.stringify(message)
      await this.client.publish(channel, payload)
      console.log(`📤 Published to ${channel}:`, message)
    } catch (err) {
      console.error(`❌ Failed to publish to ${channel}:`, err)
      throw err
    }
  }

  async quit(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
      console.log("Redis publisher connection closed")
    }
  }
}

const redisPublisher = new RedisPublisher()

export { redisPublisher }
