import { ConfirmPayment } from '@application/ConfirmPayment';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { IPaymentGateway } from '@domain/ports/IPaymentGateway';
import type { Order } from '@domain/entities/Order';
import { AppError } from '@shared/errors/AppError';
import * as RedisClient from '@infrastructure/cache/RedisClient';

describe('ConfirmPayment Use Case', () => {
  let mockOrderRepo: jest.Mocked<IOrderRepository>;
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let mockPaymentGateway: jest.Mocked<IPaymentGateway>;
  let cacheDelSpy: jest.SpyInstance;

  const mockOrder: Order = {
    id: 'order-uuid-99',
    userId: 'user-uuid-1',
    productIds: ['prod-1', 'prod-2'],
    totalAmountCents: 50000000,
    baseFeeCents: 500000,
    shippingFeeCents: 800000,
    status: 'PENDING',
    deliveryInfo: {
      address: 'Calle 1 # 2-3',
      city: 'Medellín',
      department: 'Antioquia',
      postalCode: '050001',
      recipientName: 'Ana López',
      recipientPhone: '3009998877',
    },
    reference: 'REF_999',
    wompiTransactionId: null,
    cardInfo: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

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

    mockProductRepo = {
      findById: jest.fn(),
      findAll: jest.fn(),
      decrementStock: jest.fn(),
    };

    mockPaymentGateway = {
      getConfig: jest.fn(),
      tokenizeCard: jest.fn(),
      createTransaction: jest.fn(),
      getTransaction: jest.fn(),
      generateIntegritySignature: jest.fn(),
    };

    cacheDelSpy = jest.spyOn(RedisClient, 'cacheDel').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe actualizar la orden a APPROVED, descontar stock de cada producto e invalidar caché de Redis', async () => {
    mockPaymentGateway.getTransaction.mockResolvedValue({
      id: 'wompi-tx-123',
      status: 'APPROVED',
      reference: 'REF_999',
      amountInCents: 50000000,
      currency: 'COP',
      createdAt: '2026-09-01T12:00:00.000Z',
    });

    mockOrderRepo.findByWompiTransactionId.mockResolvedValue(mockOrder);
    mockOrderRepo.updateStatus.mockResolvedValue({
      ...mockOrder,
      status: 'APPROVED',
      wompiTransactionId: 'wompi-tx-123',
    });
    mockProductRepo.decrementStock.mockResolvedValue(undefined);

    const useCase = new ConfirmPayment(mockOrderRepo, mockProductRepo, mockPaymentGateway);
    const result = await useCase.execute('wompi-tx-123');

    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith('order-uuid-99', 'APPROVED', 'wompi-tx-123');
    expect(mockProductRepo.decrementStock).toHaveBeenCalledWith('prod-1');
    expect(mockProductRepo.decrementStock).toHaveBeenCalledWith('prod-2');
    expect(cacheDelSpy).toHaveBeenCalledWith('products:all');
    expect(result.order.status).toBe('APPROVED');
    expect(result.wompiStatus).toBe('APPROVED');
  });

  it('debe actualizar la orden a DECLINED sin descontar stock cuando la pasarela rechaza la transacción', async () => {
    mockPaymentGateway.getTransaction.mockResolvedValue({
      id: 'wompi-tx-456',
      status: 'DECLINED',
      reference: 'REF_999',
      amountInCents: 50000000,
      currency: 'COP',
      createdAt: '2026-09-01T12:00:00.000Z',
    });

    mockOrderRepo.findByWompiTransactionId.mockResolvedValue(mockOrder);
    mockOrderRepo.updateStatus.mockResolvedValue({
      ...mockOrder,
      status: 'DECLINED',
      wompiTransactionId: 'wompi-tx-456',
    });

    const useCase = new ConfirmPayment(mockOrderRepo, mockProductRepo, mockPaymentGateway);
    const result = await useCase.execute('wompi-tx-456');

    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith('order-uuid-99', 'DECLINED', 'wompi-tx-456');
    expect(mockProductRepo.decrementStock).not.toHaveBeenCalled();
    expect(cacheDelSpy).not.toHaveBeenCalled();
    expect(result.order.status).toBe('DECLINED');
  });

  it('debe retornar la orden intacta si su estado ya no es PENDING (idempotencia)', async () => {
    const alreadyApprovedOrder: Order = {
      ...mockOrder,
      status: 'APPROVED',
      wompiTransactionId: 'wompi-tx-existing',
    };

    mockPaymentGateway.getTransaction.mockResolvedValue({
      id: 'wompi-tx-existing',
      status: 'APPROVED',
      reference: 'REF_999',
      amountInCents: 50000000,
      currency: 'COP',
      createdAt: '2026-09-01T12:00:00.000Z',
    });

    mockOrderRepo.findByWompiTransactionId.mockResolvedValue(alreadyApprovedOrder);

    const useCase = new ConfirmPayment(mockOrderRepo, mockProductRepo, mockPaymentGateway);
    const result = await useCase.execute('wompi-tx-existing');

    expect(mockOrderRepo.updateStatus).not.toHaveBeenCalled();
    expect(mockProductRepo.decrementStock).not.toHaveBeenCalled();
    expect(result.order.status).toBe('APPROVED');
  });

  it('debe lanzar AppError 404 si la orden no se encuentra por txId ni por reference', async () => {
    mockPaymentGateway.getTransaction.mockResolvedValue({
      id: 'wompi-unknown',
      status: 'APPROVED',
      reference: 'REF_UNKNOWN',
      amountInCents: 10000,
      currency: 'COP',
      createdAt: '2026-09-01T12:00:00.000Z',
    });

    mockOrderRepo.findByWompiTransactionId.mockResolvedValue(null);
    mockOrderRepo.findByReference.mockResolvedValue(null);

    const useCase = new ConfirmPayment(mockOrderRepo, mockProductRepo, mockPaymentGateway);

    await expect(useCase.execute('wompi-unknown')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Order not found',
    });
  });
});
