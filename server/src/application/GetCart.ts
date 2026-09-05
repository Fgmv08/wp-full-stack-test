import type { IUserRepository } from '@domain/ports/IUserRepository';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { Order } from '@domain/entities/Order';
import { AppError } from '@shared/errors/AppError';

export interface CartResponse {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    idType: string;
    idNumber: string;
  };
  order: Order | null;
}

export class GetCart {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly orderRepo: IOrderRepository,
  ) {}

  async execute(): Promise<CartResponse> {
    const user = await this.userRepo.findOne();
    if (!user) throw AppError.notFound('User');

    const order = await this.orderRepo.findByUserId(user.id);

    return {
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        idType: user.idType,
        idNumber: user.idNumber,
      },
      order,
    };
  }
}
