import express from 'express';
import request from 'supertest';
import { createCartRoutes } from '@interfaces/http/routes/cart.routes';
import { errorHandler } from '@interfaces/http/middleware/errorHandler';
import type { IUserRepository } from '@domain/ports/IUserRepository';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { User } from '@domain/entities/User';
import type { Order } from '@domain/entities/Order';

describe('Cart Routes (Supertest + Express)', () => {
  let app: express.Express;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockOrderRepo: jest.Mocked<IOrderRepository>;

  const sampleUser: User = {
    id: 'user-001',
    firstName: 'Diana',
    lastName: 'Prince',
    email: 'diana@amazon.com',
    phone: '3201112233',
    idType: 'CC',
    idNumber: '55443322',
    createdAt: new Date(),
  };

  const sampleOrder: Order = {
    id: 'order-001',
    userId: 'user-001',
    productIds: ['prod-abc'],
    totalAmountCents: 8500000,
    baseFeeCents: 500000,
    shippingFeeCents: 800000,
    status: 'PENDING',
    deliveryInfo: {
      address: 'Isla Paraíso #1',
      city: 'Cartagena',
      department: 'Bolívar',
      postalCode: '130001',
      recipientName: 'Diana Prince',
      recipientPhone: '3201112233',
    },
    reference: 'REF_CART_SAMPLE',
    wompiTransactionId: null,
    cardInfo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findOne: jest.fn(),
    };

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
    app.use('/api/cart', createCartRoutes(mockUserRepo, mockOrderRepo));
    app.use(errorHandler);
  });

  describe('GET /api/cart', () => {
    it('debe retornar 200 con la información del usuario y su orden asociada', async () => {
      mockUserRepo.findOne.mockResolvedValue(sampleUser);
      mockOrderRepo.findByUserId.mockResolvedValue(sampleOrder);

      const res = await request(app).get('/api/cart');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('diana@amazon.com');
      expect(res.body.data.order.id).toBe('order-001');
    });

    it('debe retornar 200 con order null si el usuario no tiene compras registradas', async () => {
      mockUserRepo.findOne.mockResolvedValue(sampleUser);
      mockOrderRepo.findByUserId.mockResolvedValue(null);

      const res = await request(app).get('/api/cart');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.id).toBe('user-001');
      expect(res.body.data.order).toBeNull();
    });

    it('debe responder 404 si el usuario no existe en la base de datos', async () => {
      mockUserRepo.findOne.mockResolvedValue(null);

      const res = await request(app).get('/api/cart');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('User not found');
    });
  });
});
