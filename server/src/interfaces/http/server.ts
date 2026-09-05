import 'reflect-metadata';
import { initializeDatabase } from '@infrastructure/database/AppDataSource';
import { getRedisClient } from '@infrastructure/cache/RedisClient';
import { buildApp } from './app';
import { env } from '@shared/config/env';

async function bootstrap(): Promise<void> {
  try {
    // 1. Connect to DB
    await initializeDatabase();

    // 2. Connect to Redis (eagerly)
    getRedisClient();

    // 3. Start HTTP server
    const app = buildApp();
    app.listen(env.PORT, () => {
      console.log(`🚀 Server running on port ${env.PORT} [${env.NODE_ENV}]`);
    });
  } catch (error) {
    console.error('❌ Bootstrap failed:', error);
    process.exit(1);
  }
}

bootstrap();
