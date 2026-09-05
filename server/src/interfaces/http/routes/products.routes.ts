import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { GetProducts } from '@application/GetProducts';
import { GetProductById } from '@application/GetProductById';
import type { IProductRepository } from '@domain/ports/IProductRepository';

export function createProductRoutes(productRepo: IProductRepository): Router {
  const router = Router();
  const getProducts = new GetProducts(productRepo);
  const getProductById = new GetProductById(productRepo);

  // GET /api/products
  router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await getProducts.execute();
      res.json({ success: true, data: products });
    } catch (err) {
      next(err);
    }
  });

  // GET /api/products/:id
  router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await getProductById.execute(String(req.params.id));
      res.json({ success: true, data: product });
    } catch (err) {
      next(err);
    }
  });

  return router;
}
