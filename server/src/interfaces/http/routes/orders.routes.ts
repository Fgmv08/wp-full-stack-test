import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { GetOrders } from '@application/GetOrders';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';

export function createOrderRoutes(orderRepo: IOrderRepository): Router {
  const router = Router();
  const getOrders = new GetOrders(orderRepo);

  // GET /api/orders
  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const orders = await getOrders.execute();
      res.json({ success: true, data: orders });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/orders/:id
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await orderRepo.findById(req.params.id);
      if (!order) {
        res.status(404).json({
          success: false,
          error: { message: 'Order not found', statusCode: 404 },
        });
        return;
      }
      res.json({ success: true, data: order });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
