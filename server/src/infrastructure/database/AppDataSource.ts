import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { env } from '@shared/config/env';
import { UserEntity } from './entities/UserEntity';
import { ProductEntity } from './entities/ProductEntity';
import { OrderEntity } from './entities/OrderEntity';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: env.POSTGRES_HOST,
  port: env.POSTGRES_PORT,
  username: env.POSTGRES_USER,
  password: env.POSTGRES_PASSWORD,
  database: env.POSTGRES_DB,
  synchronize: env.NODE_ENV === 'development', // auto-sync in dev
  logging: env.NODE_ENV === 'development',
  entities: [UserEntity, ProductEntity, OrderEntity],
  migrations: ['dist/infrastructure/database/migrations/*.js'],
  migrationsTableName: 'migrations',
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

import { runAutoSeed } from './seeders/autoSeeder';

export async function initializeDatabase(): Promise<void> {
  try {
    await AppDataSource.initialize();
    console.log('✅ Database connected');
    await runAutoSeed();
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
}
