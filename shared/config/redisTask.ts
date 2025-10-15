import { redisCache } from "./redis"

export async function getWithCache(
  cacheKey: string,
  fetchFn: () => Promise<any>,
  ttl: number,
) {
  // 1. Try Redis
  let data = await redisCache.get(cacheKey)

  if (data) {
    console.info({ cacheKey, hit: true }, "Cache HIT")
    return data
  }

  console.info({ cacheKey, hit: false }, "Cache MISS – querying DB")

  // 2. Miss → fetch from DB
  data = await fetchFn()

  console.info(data, "Fetched data from DB")

  // 3. Write-through to Redis (fire-and-forget errors are OK for a cache)
  try {
    await redisCache.set(cacheKey, data, ttl)
  } catch (err) {
    console.warn({ err, cacheKey }, "Failed to write to Redis cache")
    // Non-fatal – continue serving from DB result
  }

  return data
}
