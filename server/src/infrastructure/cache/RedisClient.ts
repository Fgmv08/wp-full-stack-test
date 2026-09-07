import Redis from 'ioredis';
import { env } from '@shared/config/env';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (times: number) => {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 500, 2000);
      },
    });

    redisClient.on('connect', () => console.log('✅ Redis connected successfully'));
    redisClient.on('error', (err: Error) => console.warn('⚠️ Redis connection warning:', err.message));
  }
  return redisClient;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  try {
    const client = getRedisClient();
    const value = await client.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  } catch (err) {
    console.warn(`[Redis] Cache miss/error for key "${key}":`, (err as Error).message);
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  try {
    const client = getRedisClient();
    await client.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.warn(`[Redis] Cache set error for key "${key}":`, (err as Error).message);
  }
}

export async function cacheDel(key: string): Promise<void> {
  try {
    const client = getRedisClient();
    await client.del(key);
  } catch (err) {
    console.warn(`[Redis] Cache del error for key "${key}":`, (err as Error).message);
  }
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    try {
      await redisClient.quit();
    } catch {
      redisClient.disconnect();
    } finally {
      redisClient = null;
    }
  }
}

