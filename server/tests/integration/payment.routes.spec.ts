import express from 'express';
import request from 'supertest';
import { createPaymentRoutes } from '@interfaces/http/routes/payment.routes';
import { errorHandler } from '@interfaces/http/middleware/errorHandler';
import type { IUserRepository } from '@domain/ports/IUserRepository';
import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { IPaymentGateway } from '@domain/ports/IPaymentGateway';
import type { User } from '@domain/entities/User';
import type { Product } from '@domain/entities/Product';
import type { Order } from '@domain/entities/Order';
import { env } from '@shared/config/env';
import * as RedisClient from '@infrastructure/cache/RedisClient';

jest.mock('@infrastructure/cache/RedisClient', () => ({
  cacheGet: jest.fn().mockResolvedValue(null),
  cacheSet: jest.fn().mockResolvedValue(undefined),
  cacheDel: jest.fn().mockResolvedValue(undefined),
  getRedisClient: jest.fn(),
  closeRedisClient: jest.fn().mockResolvedValue(undefined),
}));

describe('Payment Routes (Supertest + Express)', () => {
  let app: express.Express;
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let mockOrderRepo: jest.Mocked<IOrderRepository>;
  let mockPaymentGateway: jest.Mocked<IPaymentGateway>;

  const sampleUser: User = {
    id: '11111111-1111-1111-1111-111111111111',
    firstName: 'Mario',
    lastName: 'Bros',
    email: 'mario@nintendo.com',
    phone: '3112223344',
    idType: 'CC',
    idNumber: '12345678',
    createdAt: new Date(),
  };

  const sampleProduct: Product = {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Gorra Roja Clásica',
    description: 'Gorra emblemática',
    priceCents: 4500000,
    stock: 20,
    imageUrl: 'http://img.com/gorra.png',
    category: 'Ropa',
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockUserRepo = {
      findById: jest.fn(),
      findOne: jest.fn(),
    };

    mockProductRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      decrementStock: jest.fn(),
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

    mockPaymentGateway = {
      getConfig: jest.fn().mockReturnValue({
        publicKey: env.PAYMENT_PUBLIC_KEY,
        currency: env.CURRENCY,
        baseFeeCents: env.BASE_FEE_CENTS,
        shippingFeeCents: env.SHIPPING_FEE_CENTS,
      }),
      tokenizeCard: jest.fn(),
      createTransaction: jest.fn(),
      getTransaction: jest.fn(),
      generateIntegritySignature: jest.fn(),
    };

    app = express();
    app.use(express.json());
    app.use('/api/payment', createPaymentRoutes(mockUserRepo, mockProductRepo, mockOrderRepo, mockPaymentGateway));
    app.use(errorHandler);
  });

  describe('GET /api/payment/config', () => {
    it('debe retornar 200 con la configuración de Wompi', async () => {
      const res = await request(app).get('/api/payment/config');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.publicKey).toBe(env.PAYMENT_PUBLIC_KEY);
      expect(res.body.data.currency).toBe('COP');
    });
  });

  describe('POST /api/payment/datapayment', () => {
    const validDataPaymentPayload = {
      productId: '22222222-2222-2222-2222-222222222222',
      deliveryInfo: {
        address: 'Reino Champiñón Casa 1',
        city: 'Bogotá',
        department: 'Cundinamarca',
        postalCode: '110111',
        recipientName: 'Mario Bros',
        recipientPhone: '3112223344',
      },
      card: {
        number: '4242424242424242',
        cardHolder: 'Mario Bros',
        expMonth: '11',
        expYear: '29',
        cvc: '123',
      },
    };

    it('debe responder 200 con la firma de integridad calculada y orderId creado', async () => {
      mockUserRepo.findOne.mockResolvedValue(sampleUser);
      mockProductRepo.findById.mockResolvedValue(sampleProduct);

      const createdOrder: Order = {
        id: 'ord-gen-123',
        userId: sampleUser.id,
        productIds: [sampleProduct.id],
        totalAmountCents: 5800000,
        baseFeeCents: 500000,
        shippingFeeCents: 800000,
        status: 'PENDING',
        deliveryInfo: validDataPaymentPayload.deliveryInfo,
        reference: 'REF_TEST_GEN',
        wompiTransactionId: null,
        cardInfo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockOrderRepo.create.mockResolvedValue(createdOrder);

      const res = await request(app)
        .post('/api/payment/datapayment')
        .send(validDataPaymentPayload);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.orderId).toBe('ord-gen-123');
      expect(res.body.data.signature.integrity).toBeDefined();
    });

    it('debe responder 400 (validation error) si los campos requeridos no son válidos', async () => {
      const res = await request(app)
        .post('/api/payment/datapayment')
        .send({
          productId: 'not-a-valid-uuid',
          deliveryInfo: {
            address: 'Calle',
            city: 'B',
            department: 'C',
            postalCode: '1',
            recipientName: 'M',
            recipientPhone: '1',
          },
          card: {
            number: '123',
            cardHolder: 'M',
            expMonth: '1',
            expYear: '1',
          },
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Validation error');
    });
  });

  describe('POST /api/payment/confirm', () => {
    it('debe responder 200 y confirmar la orden con el ID de transacción de Wompi', async () => {
      const mockOrder: Order = {
        id: 'ord-confirm-001',
        userId: 'usr-1',
        productIds: ['prod-1'],
        totalAmountCents: 5000000,
        baseFeeCents: 500000,
        shippingFeeCents: 800000,
        status: 'PENDING',
        deliveryInfo: {
          address: 'Calle 1 # 2-3',
          city: 'Bogotá',
          department: 'Cundinamarca',
          postalCode: '110111',
          recipientName: 'Test',
          recipientPhone: '3001234567',
        },
        reference: 'REF_CONFIRM_1',
        wompiTransactionId: null,
        cardInfo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPaymentGateway.getTransaction.mockResolvedValue({
        id: 'wompi-tx-999',
        status: 'APPROVED',
        reference: 'REF_CONFIRM_1',
        amountInCents: 5000000,
        currency: 'COP',
        createdAt: '2026-09-01T12:00:00.000Z',
      });

      mockOrderRepo.findByWompiTransactionId.mockResolvedValue(mockOrder);
      mockOrderRepo.updateStatus.mockResolvedValue({
        ...mockOrder,
        status: 'APPROVED',
        wompiTransactionId: 'wompi-tx-999',
      });
      mockProductRepo.decrementStock.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/payment/confirm')
        .send({ wompiTransactionId: 'wompi-tx-999' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.order.status).toBe('APPROVED');
      expect(res.body.data.wompiStatus).toBe('APPROVED');
    });

    it('debe responder 400 si no se provee wompiTransactionId en el payload', async () => {
      const res = await request(app)
        .post('/api/payment/confirm')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Validation error');
    });
  });

  describe('GET /api/payment/transaction/:wompiTxId', () => {
    it('debe retornar 200 con la orden y estado de Wompi', async () => {
      const mockOrder: Order = {
        id: 'ord-tx-001',
        userId: 'usr-1',
        productIds: ['prod-1'],
        totalAmountCents: 5000000,
        baseFeeCents: 500000,
        shippingFeeCents: 800000,
        status: 'APPROVED',
        deliveryInfo: {
          address: 'Calle 1 # 2-3',
          city: 'Bogotá',
          department: 'Cundinamarca',
          postalCode: '110111',
          recipientName: 'Test',
          recipientPhone: '3001234567',
        },
        reference: 'REF_TX_1',
        wompiTransactionId: 'tx-12345',
        cardInfo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockOrderRepo.findByWompiTransactionId.mockResolvedValue(mockOrder);
      mockPaymentGateway.getTransaction.mockResolvedValue({
        id: 'tx-12345',
        status: 'APPROVED',
        reference: 'REF_TX_1',
        amountInCents: 5000000,
        currency: 'COP',
        createdAt: '2026-09-01T12:00:00.000Z',
      });

      const res = await request(app).get('/api/payment/transaction/tx-12345');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.wompiTransactionId).toBe('tx-12345');
      expect(res.body.data.wompiStatus).toBe('APPROVED');
    });

    it('debe responder 404 si la orden no está asociada a dicho wompiTxId', async () => {
      mockOrderRepo.findByWompiTransactionId.mockResolvedValue(null);

      const res = await request(app).get('/api/payment/transaction/tx-inexistente');

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toBe('Order not found');
    });
  });
});
