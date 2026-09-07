import express from 'express';
import request from 'supertest';
import { createProductRoutes } from '@interfaces/http/routes/products.routes';
import { errorHandler } from '@interfaces/http/middleware/errorHandler';
import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { Product } from '@domain/entities/Product';
import * as RedisClient from '@infrastructure/cache/RedisClient';

describe('Products Routes (Supertest + Express)', () => {
  let app: express.Express;
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let cacheGetSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;

  const sampleProducts: Product[] = [
    {
      id: 'prod-001',
      name: 'Mochila Impermeable',
      description: 'Mochila para laptop y viajes',
      priceCents: 9000000,
      stock: 12,
      imageUrl: 'http://img.com/mochila.png',
      category: 'Accesorios',
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockProductRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decrementStock: jest.fn(),
    };

    cacheGetSpy = jest.spyOn(RedisClient, 'cacheGet').mockResolvedValue(null);
    cacheSetSpy = jest.spyOn(RedisClient, 'cacheSet').mockResolvedValue(undefined);

    app = express();
    app.use(express.json());
    app.use('/api/products', createProductRoutes(mockProductRepo));
    app.use(errorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('debe retornar 200 y la lista de productos', async () => {
      mockProductRepo.findAll.mockResolvedValue(sampleProducts);

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe('prod-001');
    });

    it('debe responder 200 con array vacío cuando no hay registros', async () => {
      mockProductRepo.findAll.mockResolvedValue([]);

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual([]);
    });

    it('debe retornar 500 si el repositorio de base de datos arroja un error imprevisto', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockProductRepo.findAll.mockRejectedValue(new Error('PostgreSQL out of memory'));

      const res = await request(app).get('/api/products');

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Internal server error');

      consoleSpy.mockRestore();
    });
  });

  describe('GET /api/products/:id', () => {
    it('debe retornar 200 y el producto cuando el ID existe', async () => {
      mockProductRepo.findById.mockResolvedValue(sampleProducts[0]);

      const res = await request(app).get('/api/products/prod-001');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Mochila Impermeable');
    });

    it('debe retornar 404 estructurado cuando el producto no existe', async () => {
      mockProductRepo.findById.mockResolvedValue(null);

      const res = await request(app).get('/api/products/prod-inexistente');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Product not found');
    });
  });
});
