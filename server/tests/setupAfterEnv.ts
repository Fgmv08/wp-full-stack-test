import { closeRedisClient } from '../src/infrastructure/cache/RedisClient';

afterAll(async () => {
  await closeRedisClient();
});
