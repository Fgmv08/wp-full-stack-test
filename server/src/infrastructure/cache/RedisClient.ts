import Redis from 'ioredis';
import { env } from '@shared/config/env';

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      lazyConnect: false,
      retryStrategy: (times: number) => Math.min(times * 500, 2000),
    });

    redisClient.on('connect', () => console.log('✅ Redis connected'));
    redisClient.on('error', (err: Error) => console.error('❌ Redis error:', err.message));
  }
  return redisClient;
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const client = getRedisClient();
  const value = await client.get(key);
  if (!value) return null;
  return JSON.parse(value) as T;
}

export async function cacheSet(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
  const client = getRedisClient();
  await client.setex(key, ttlSeconds, JSON.stringify(value));
}

export async function cacheDel(key: string): Promise<void> {
  const client = getRedisClient();
  await client.del(key);
}
