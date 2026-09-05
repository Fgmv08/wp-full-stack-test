import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { IPaymentGateway } from '@domain/ports/IPaymentGateway';
import type { Order } from '@domain/entities/Order';
import { AppError } from '@shared/errors/AppError';

export interface GetTransactionResult {
  order: Order;
  wompiStatus: string;
  wompiTransactionId: string;
}

export class GetTransaction {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  async execute(wompiTransactionId: string): Promise<GetTransactionResult> {
    const order = await this.orderRepo.findByWompiTransactionId(wompiTransactionId);
    if (!order) throw AppError.notFound('Order');

    const txResult = await this.paymentGateway.getTransaction(wompiTransactionId);

    return {
      order,
      wompiStatus: txResult.status,
      wompiTransactionId: txResult.id,
    };
  }
}
