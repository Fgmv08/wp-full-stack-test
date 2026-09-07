import crypto from 'crypto';
import { GenerateDataPayment } from '@application/GenerateDataPayment';
import type { IUserRepository } from '@domain/ports/IUserRepository';
import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { User } from '@domain/entities/User';
import type { Product } from '@domain/entities/Product';
import type { Order } from '@domain/entities/Order';
import { env } from '@shared/config/env';

describe('GenerateDataPayment Use Case', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let mockOrderRepo: jest.Mocked<IOrderRepository>;

  const mockUser: User = {
    id: 'user-uuid-1',
    firstName: 'Carlos',
    lastName: 'Gómez',
    email: 'carlos@test.com',
    phone: '3109876543',
    idType: 'CC',
    idNumber: '123456789',
    createdAt: new Date(),
  };

  const mockProduct: Product = {
    id: 'product-uuid-1',
    name: 'Audífonos Bluetooth',
    description: 'Audífonos de alta fidelidad',
    priceCents: 10000000, // 100.000 COP
    stock: 10,
    imageUrl: 'http://example.com/audio.png',
    category: 'Electrónica',
    createdAt: new Date(),
  };

  const validPaymentInput = {
    productId: 'product-uuid-1',
    deliveryInfo: {
      address: 'Carrera 7 # 72-41',
      city: 'Bogotá',
      department: 'Cundinamarca',
      postalCode: '110221',
      recipientName: 'Carlos Gómez',
      recipientPhone: '3109876543',
    },
    card: {
      number: '4242424242424242',
      cardHolder: 'Carlos Gómez',
      expMonth: '12',
      expYear: '28',
      cvc: '123',
    },
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
  });

  it('debe generar exitosamente los datos de pago con firma SHA-256 e integridad válida', async () => {
    mockUserRepo.findOne.mockResolvedValue(mockUser);
    mockProductRepo.findById.mockResolvedValue(mockProduct);

    const createdOrder: Order = {
      id: 'order-123',
      userId: mockUser.id,
      productIds: [mockProduct.id],
      totalAmountCents: mockProduct.priceCents + env.BASE_FEE_CENTS + env.SHIPPING_FEE_CENTS,
      baseFeeCents: env.BASE_FEE_CENTS,
      shippingFeeCents: env.SHIPPING_FEE_CENTS,
      status: 'PENDING',
      deliveryInfo: validPaymentInput.deliveryInfo,
      reference: 'REF_TEST_123',
      wompiTransactionId: null,
      cardInfo: {
        brand: 'VISA',
        lastFour: '4242',
        cardHolder: 'Carlos Gómez',
        expMonth: '12',
        expYear: '28',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    mockOrderRepo.create.mockResolvedValue(createdOrder);

    const useCase = new GenerateDataPayment(mockUserRepo, mockProductRepo, mockOrderRepo);
    const result = await useCase.execute(validPaymentInput);

    expect(result.orderId).toBe('order-123');
    expect(result.currency).toBe(env.CURRENCY);
    expect(result.amountInCents).toBe(mockProduct.priceCents + env.BASE_FEE_CENTS + env.SHIPPING_FEE_CENTS);
    expect(result.publicKey).toBe(env.PAYMENT_PUBLIC_KEY);

    // Verificar cálculo exacto de la firma SHA-256
    const expectedCadena = `${result.reference}${result.amountInCents}${env.CURRENCY}${env.PAYMENT_INTEGRITY_KEY}`;
    const expectedHash = crypto.createHash('sha256').update(expectedCadena).digest('hex');
    expect(result.signature.integrity).toBe(expectedHash);

    // Verificar que los últimos 4 dígitos y enmascaramiento se enviaron a la orden
    expect(mockOrderRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cardInfo: expect.objectContaining({
          lastFour: '4242',
          brand: 'VISA',
        }),
      }),
    );
  });

  it('debe lanzar AppError 404 si el usuario no existe', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);

    const useCase = new GenerateDataPayment(mockUserRepo, mockProductRepo, mockOrderRepo);

    await expect(useCase.execute(validPaymentInput)).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found',
    });
    expect(mockProductRepo.findById).not.toHaveBeenCalled();
  });

  it('debe lanzar AppError 404 si el producto no existe', async () => {
    mockUserRepo.findOne.mockResolvedValue(mockUser);
    mockProductRepo.findById.mockResolvedValue(null);

    const useCase = new GenerateDataPayment(mockUserRepo, mockProductRepo, mockOrderRepo);

    await expect(useCase.execute(validPaymentInput)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Product not found',
    });
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });

  it('debe lanzar AppError 409 (conflict) si el producto no tiene stock disponible', async () => {
    mockUserRepo.findOne.mockResolvedValue(mockUser);
    mockProductRepo.findById.mockResolvedValue({
      ...mockProduct,
      stock: 0,
    });

    const useCase = new GenerateDataPayment(mockUserRepo, mockProductRepo, mockOrderRepo);

    await expect(useCase.execute(validPaymentInput)).rejects.toMatchObject({
      statusCode: 409,
      message: 'El producto está agotado',
    });
    expect(mockOrderRepo.create).not.toHaveBeenCalled();
  });
});
