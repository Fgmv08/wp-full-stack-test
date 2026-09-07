import { GetCart } from '@application/GetCart';
import type { IUserRepository } from '@domain/ports/IUserRepository';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { User } from '@domain/entities/User';
import type { Order } from '@domain/entities/Order';
import { AppError } from '@shared/errors/AppError';

describe('GetCart Use Case', () => {
  let mockUserRepo: jest.Mocked<IUserRepository>;
  let mockOrderRepo: jest.Mocked<IOrderRepository>;

  const mockUser: User = {
    id: 'user-1',
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan@example.com',
    phone: '3001234567',
    idType: 'CC',
    idNumber: '1098765432',
    createdAt: new Date(),
  };

  const mockOrder: Order = {
    id: 'order-1',
    userId: 'user-1',
    productIds: ['prod-1'],
    totalAmountCents: 6300000,
    baseFeeCents: 500000,
    shippingFeeCents: 800000,
    status: 'PENDING',
    deliveryInfo: {
      address: 'Calle 100 #15-20',
      city: 'Bogotá',
      department: 'Cundinamarca',
      postalCode: '110111',
      recipientName: 'Juan Pérez',
      recipientPhone: '3001234567',
    },
    reference: 'REF_CART_1',
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
  });

  it('debe retornar el usuario y su orden asociada exitosamente', async () => {
    mockUserRepo.findOne.mockResolvedValue(mockUser);
    mockOrderRepo.findByUserId.mockResolvedValue(mockOrder);

    const useCase = new GetCart(mockUserRepo, mockOrderRepo);
    const result = await useCase.execute();

    expect(mockUserRepo.findOne).toHaveBeenCalledTimes(1);
    expect(mockOrderRepo.findByUserId).toHaveBeenCalledWith(mockUser.id);
    expect(result).toEqual({
      user: {
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        phone: mockUser.phone,
        idType: mockUser.idType,
        idNumber: mockUser.idNumber,
      },
      order: mockOrder,
    });
  });

  it('debe retornar order como null si el usuario aún no tiene órdenes previas', async () => {
    mockUserRepo.findOne.mockResolvedValue(mockUser);
    mockOrderRepo.findByUserId.mockResolvedValue(null);

    const useCase = new GetCart(mockUserRepo, mockOrderRepo);
    const result = await useCase.execute();

    expect(result.user.id).toBe(mockUser.id);
    expect(result.order).toBeNull();
  });

  it('debe lanzar AppError 404 si el usuario no existe en la base de datos', async () => {
    mockUserRepo.findOne.mockResolvedValue(null);

    const useCase = new GetCart(mockUserRepo, mockOrderRepo);

    await expect(useCase.execute()).rejects.toThrow(AppError);
    await expect(useCase.execute()).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found',
    });
    expect(mockOrderRepo.findByUserId).not.toHaveBeenCalled();
  });
});
