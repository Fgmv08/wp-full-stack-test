import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  POSTGRES_HOST: z.string().default('postgres'),
  POSTGRES_PORT: z.coerce.number().default(5432),
  POSTGRES_USER: z.string(),
  POSTGRES_PASSWORD: z.string(),
  POSTGRES_DB: z.string(),

  REDIS_HOST: z.string().default('redis'),
  REDIS_PORT: z.coerce.number().default(6378),

  CORS_ORIGIN: z.string().default('http://localhost:5000'),

  PAYMENT_PUBLIC_KEY: z.string(),
  PAYMENT_PRIVATE_KEY: z.string(),
  PAYMENT_INTEGRITY_KEY: z.string(),
  PAYMENT_EVENTS_KEY: z.string(),
  PAYMENT_API_URL: z.string().url(),

  BASE_FEE_CENTS: z.coerce.number().default(500000),
  SHIPPING_FEE_CENTS: z.coerce.number().default(800000),
  CURRENCY: z.string().default('COP'),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid environment variables:', _env.error.format());
  process.exit(1);
}

export const env = _env.data;
