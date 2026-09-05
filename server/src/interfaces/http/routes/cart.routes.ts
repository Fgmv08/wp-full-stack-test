import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { GetCart } from '@application/GetCart';
import type { IUserRepository } from '@domain/ports/IUserRepository';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';

export function createCartRoutes(
  userRepo: IUserRepository,
  orderRepo: IOrderRepository,
): Router {
  const router = Router();
  const getCart = new GetCart(userRepo, orderRepo);

  // GET /api/cart
  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const cart = await getCart.execute();
      res.json({ success: true, data: cart });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
