import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import { env } from '@shared/config/env';
import { errorHandler } from './middleware/errorHandler';
import { createProductRoutes } from './routes/products.routes';
import { createCartRoutes } from './routes/cart.routes';
import { createPaymentRoutes } from './routes/payment.routes';
import { AppDataSource } from '@infrastructure/database/AppDataSource';
import { PostgresUserRepository } from '@infrastructure/database/repositories/PostgresUserRepository';
import { PostgresProductRepository } from '@infrastructure/database/repositories/PostgresProductRepository';
import { PostgresOrderRepository } from '@infrastructure/database/repositories/PostgresOrderRepository';
import { WompiAdapter } from '@infrastructure/payment/WompiAdapter';

export function buildApp() {
  const app = express();

  // ── Middlewares ──────────────────────────────────────────────────────────────
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // ── Health Check ─────────────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // ── Dependency Injection (manual, clean) ─────────────────────────────────────
  const userRepo = new PostgresUserRepository(AppDataSource);
  const productRepo = new PostgresProductRepository(AppDataSource);
  const orderRepo = new PostgresOrderRepository(AppDataSource);
  const paymentGateway = new WompiAdapter();

  // ── Routes ───────────────────────────────────────────────────────────────────
  app.use('/api/products', createProductRoutes(productRepo));
  app.use('/api/cart', createCartRoutes(userRepo, orderRepo));
  app.use('/api/payment', createPaymentRoutes(userRepo, productRepo, orderRepo, paymentGateway));

  // ── 404 Handler ──────────────────────────────────────────────────────────────
  app.use((_req, res) => {
    res.status(404).json({ success: false, error: { message: 'Route not found', statusCode: 404 } });
  });

  // ── Error Handler (must be last) ─────────────────────────────────────────────
  app.use(errorHandler);

  return app;
}
