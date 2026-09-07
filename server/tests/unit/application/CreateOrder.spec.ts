import { CreateOrder } from '@application/CreateOrder';
import type { IUserRepository } from '@domain/ports/IUserRepository';
import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { IPaymentGateway } from '@domain/ports/IPaymentGateway';
import type { User } from '@domain/entities/User';
import type { Product } from '@domain/entities/Product';
import type { Order } from '@domain/entities/Order';
import { AppError } from '@shared/errors/AppError';
import { env } from '@shared/config/env';
import * as RedisClient from '@infrastructure/cache/RedisClient';

describe('CreateOrder Use Case', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let mockOrderRepo: jest.Mocked<IOrderRepository>;
  let mockPaymentGateway: jest.Mocked<IPaymentGateway>;
  let cacheDelSpy: jest.SpyInstance;

  const mockUser: User = {
    id: 'user-id-1',
    firstName: 'Laura',
    lastName: 'Torres',
    email: 'laura@example.com',
    phone: '3151234567',
    idType: 'CC',
    idNumber: '987654321',
    createdAt: new Date(),
  };

  const mockProduct: Product = {
    id: 'prod-id-1',
    name: 'Teclado Mecánico',
    description: 'Teclado RGB Switches Blue',
    priceCents: 20000000,
    stock: 5,
    imageUrl: 'http://example.com/teclado.png',
    category: 'Accesorios',
    createdAt: new Date(),
  };

  const validInput = {
    productId: 'prod-id-1',
    card: {
      number: '4242424242424242',
      cvc: '123',
      expMonth: '10',
      expYear: '27',
      cardHolder: 'Laura Torres',
    },
    deliveryInfo: {
      address: 'Calle 50 # 10-20',
      city: 'Cali',
      department: 'Valle del Cauca',
      postalCode: '760001',
      recipientName: 'Laura Torres',
      recipientPhone: '3151234567',
    },
    redirectUrl: 'http://localhost:5000/payment-result',
    installments: 2,
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

  it('debe tokenizar tarjeta, crear orden, procesar transacción aprobada y decrementar stock', async () => {
    mockUserRepo.findOne.mockResolvedValue(mockUser);
    mockProductRepo.findById.mockResolvedValue(mockProduct);
    mockPaymentGateway.tokenizeCard.mockResolvedValue('tok_card_test_999');

    const expectedTotal = mockProduct.priceCents + env.BASE_FEE_CENTS + env.SHIPPING_FEE_CENTS;
    const initialOrder: Order = {
      id: 'order-100',
      userId: mockUser.id,
      productIds: [mockProduct.id],
      totalAmountCents: expectedTotal,
      baseFeeCents: env.BASE_FEE_CENTS,
      shippingFeeCents: env.SHIPPING_FEE_CENTS,
      status: 'PENDING',
      deliveryInfo: validInput.deliveryInfo,
      reference: 'REF_100',
      wompiTransactionId: null,
      cardInfo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockOrderRepo.create.mockResolvedValue(initialOrder);

    mockPaymentGateway.createTransaction.mockResolvedValue({
      id: 'tx-wompi-888',
      status: 'APPROVED',
      reference: 'order-100',
      amountInCents: expectedTotal,
      currency: env.CURRENCY,
      createdAt: '2026-09-01T12:00:00.000Z',
    });

    const approvedOrder: Order = {
      ...initialOrder,
      status: 'APPROVED',
      wompiTransactionId: 'tx-wompi-888',
    };
    mockOrderRepo.updateStatus.mockResolvedValue(approvedOrder);
    mockProductRepo.decrementStock.mockResolvedValue(undefined);

    const useCase = new CreateOrder(mockUserRepo, mockProductRepo, mockOrderRepo, mockPaymentGateway);
    const result = await useCase.execute(validInput);

    expect(mockPaymentGateway.tokenizeCard).toHaveBeenCalledWith(validInput.card);
    expect(mockOrderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: mockUser.id,
        totalAmountCents: expectedTotal,
      }),
    );
    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith('order-100', 'APPROVED', 'tx-wompi-888');
    expect(mockProductRepo.decrementStock).toHaveBeenCalledWith(mockProduct.id);
    expect(cacheDelSpy).toHaveBeenCalledWith('products:all');
    expect(result.wompiStatus).toBe('APPROVED');
    expect(result.wompiTransactionId).toBe('tx-wompi-888');
  });

  it('debe mantener orden como PENDING y no decrementar stock si la pasarela retorna PENDING', async () => {
    mockUserRepo.findOne.mockResolvedValue(mockUser);
    mockProductRepo.findById.mockResolvedValue(mockProduct);
    mockPaymentGateway.tokenizeCard.mockResolvedValue('tok_card_test_999');

    const expectedTotal = mockProduct.priceCents + env.BASE_FEE_CENTS + env.SHIPPING_FEE_CENTS;
    const initialOrder: Order = {
      id: 'order-200',
      userId: mockUser.id,
      productIds: [mockProduct.id],
      totalAmountCents: expectedTotal,
      baseFeeCents: env.BASE_FEE_CENTS,
      shippingFeeCents: env.SHIPPING_FEE_CENTS,
      status: 'PENDING',
      deliveryInfo: validInput.deliveryInfo,
      reference: 'REF_200',
      wompiTransactionId: null,
      cardInfo: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockOrderRepo.create.mockResolvedValue(initialOrder);

    mockPaymentGateway.createTransaction.mockResolvedValue({
      id: 'tx-wompi-pending',
      status: 'PENDING',
      reference: 'order-200',
      amountInCents: expectedTotal,
      currency: env.CURRENCY,
      createdAt: '2026-09-01T12:00:00.000Z',
    });

    mockOrderRepo.updateStatus.mockResolvedValue({
      ...initialOrder,
      wompiTransactionId: 'tx-wompi-pending',
    });

    const useCase = new CreateOrder(mockUserRepo, mockProductRepo, mockOrderRepo, mockPaymentGateway);
    const result = await useCase.execute(validInput);

    expect(mockOrderRepo.updateStatus).toHaveBeenCalledWith('order-200', 'PENDING', 'tx-wompi-pending');
    expect(mockProductRepo.decrementStock).not.toHaveBeenCalled();
    expect(cacheDelSpy).not.toHaveBeenCalled();
    expect(result.wompiStatus).toBe('PENDING');
  });

  it('debe lanzar AppError 409 si el producto no tiene stock disponible', async () => {
    mockUserRepo.findOne.mockResolvedValue(mockUser);
    mockProductRepo.findById.mockResolvedValue({
      ...mockProduct,
      stock: 0,
    });

    const useCase = new CreateOrder(mockUserRepo, mockProductRepo, mockOrderRepo, mockPaymentGateway);

    await expect(useCase.execute(validInput)).rejects.toMatchObject({
      statusCode: 409,
      message: 'Product out of stock',
    });
    expect(mockPaymentGateway.tokenizeCard).not.toHaveBeenCalled();
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });
});
