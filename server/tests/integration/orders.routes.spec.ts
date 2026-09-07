import express from 'express';
import request from 'supertest';
import { createOrderRoutes } from '@interfaces/http/routes/orders.routes';
import { errorHandler } from '@interfaces/http/middleware/errorHandler';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { Order } from '@domain/entities/Order';

describe('Orders Routes (Supertest + Express)', () => {
  let app: express.Express;
  let mockOrderRepo: jest.Mocked<IOrderRepository>;

  const sampleOrders: Order[] = [
    {
      id: 'ord-101',
      userId: 'usr-1',
      productIds: ['p1'],
      totalAmountCents: 15000000,
      baseFeeCents: 500000,
      shippingFeeCents: 800000,
      status: 'APPROVED',
      deliveryInfo: {
        address: 'Av. Siempre Viva 742',
        city: 'Bogotá',
        department: 'Cundinamarca',
        postalCode: '110111',
        recipientName: 'Homero Simpson',
        recipientPhone: '3001234567',
      },
      reference: 'REF_HOMERO',
      wompiTransactionId: 'tx-homero-1',
      cardInfo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockOrderRepo = {
      findById: jest.fn(),
      findByUserId: jest.fn(),
      findByReference: jest.fn(),
      findByWompiTransactionId: jest.fn(),
      create: jest.fn(),
      updateStatus: jest.fn(),
      findAll: jest.fn(),
    };

    app = express();
    app.use(express.json());
    app.use('/api/orders', createOrderRoutes(mockOrderRepo));
    app.use(errorHandler);
  });

  describe('GET /api/orders', () => {
    it('debe retornar 200 y el listado de órdenes registradas', async () => {
      mockOrderRepo.findAll.mockResolvedValue(sampleOrders);

      const res = await request(app).get('/api/orders');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe('ord-101');
    });

    it('debe responder 200 con arreglo vacío si no hay órdenes creadas', async () => {
      mockOrderRepo.findAll.mockResolvedValue([]);

      const res = await request(app).get('/api/orders');

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('debe retornar 200 con la orden cuando el ID es encontrado', async () => {
      mockOrderRepo.findById.mockResolvedValue(sampleOrders[0]);

      const res = await request(app).get('/api/orders/ord-101');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('ord-101');
    });

    it('debe responder 404 estructurado si la orden solicitada no existe', async () => {
      mockOrderRepo.findById.mockResolvedValue(null);

      const res = await request(app).get('/api/orders/ord-no-existe');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Order not found');
    });
  });
});
