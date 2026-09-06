import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { GetPaymentConfig } from '@application/GetPaymentConfig';
import { CreateOrder } from '@application/CreateOrder';
import { ConfirmPayment } from '@application/ConfirmPayment';
import { GetTransaction } from '@application/GetTransaction';
import { GenerateDataPayment } from '@application/GenerateDataPayment';
import { GetOrders } from '@application/GetOrders';
import type { IUserRepository } from '@domain/ports/IUserRepository';
import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { IPaymentGateway } from '@domain/ports/IPaymentGateway';

// ── Validation Schemas ─────────────────────────────────────────────────────────
const deliveryInfoSchema = z.object({
  address: z.string().min(5),
  city: z.string().min(2),
  department: z.string().min(2),
  postalCode: z.string().min(3),
  recipientName: z.string().min(3),
  recipientPhone: z.string().min(7),
});

const cardInputSchema = z.object({
  number: z.string().min(13).max(19),
  cardHolder: z.string().min(3),
  expMonth: z.string().length(2),
  expYear: z.string().length(2),
  cvc: z.string().min(3).max(4).optional(),
  brand: z.string().optional(),
});

const createOrderSchema = z.object({
  productId: z.string().uuid(),
  card: z.object({
    number: z.string().min(13).max(19),
    cvc: z.string().min(3).max(4),
    expMonth: z.string().length(2),
    expYear: z.string().length(2),
    cardHolder: z.string().min(3),
  }),
  deliveryInfo: deliveryInfoSchema,
  redirectUrl: z.string().url(),
  installments: z.number().int().min(1).max(36).optional(),
});

const dataPaymentSchema = z.object({
  productId: z.string().uuid(),
  deliveryInfo: deliveryInfoSchema,
  card: cardInputSchema,
  redirectUrl: z.string().optional(),
  installments: z.number().int().min(1).max(36).optional(),
});

export function createPaymentRoutes(
  userRepo: IUserRepository,
  productRepo: IProductRepository,
  orderRepo: IOrderRepository,
  paymentGateway: IPaymentGateway,
): Router {
  const router = Router();

  const getPaymentConfig = new GetPaymentConfig(paymentGateway);
  const createOrder = new CreateOrder(userRepo, productRepo, orderRepo, paymentGateway);
  const confirmPayment = new ConfirmPayment(orderRepo, productRepo, paymentGateway);
  const getTransaction = new GetTransaction(orderRepo, paymentGateway);
  const generateDataPayment = new GenerateDataPayment(userRepo, productRepo, orderRepo);
  const getOrders = new GetOrders(orderRepo);

  // GET /api/payment/config
  router.get('/config', (_req: Request, res: Response, next: NextFunction) => {
    try {
      const config = getPaymentConfig.execute();
      res.json({ success: true, data: config });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/payment/datapayment (or /api/datapayment)
  router.post('/datapayment', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = dataPaymentSchema.parse(req.body);
      const result = await generateDataPayment.execute(body);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/payment/orders (or /api/orders)
  router.get('/orders', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await getOrders.execute();
      res.json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/payment/create-order
  router.post('/create-order', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const body = createOrderSchema.parse(req.body);
      const result = await createOrder.execute(body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  // POST /api/payment/confirm
  router.post('/confirm', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { wompiTransactionId } = z
        .object({ wompiTransactionId: z.string().min(1) })
        .parse(req.body);
      const result = await confirmPayment.execute(wompiTransactionId);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/payment/transaction/:wompiTxId
  router.get('/transaction/:wompiTxId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await getTransaction.execute(String(req.params.wompiTxId));
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
