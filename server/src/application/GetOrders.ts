import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { Order } from '@domain/entities/Order';

export class GetOrders {
  constructor(private readonly orderRepo: IOrderRepository) {}

  async execute(): Promise<Order[]> {
    return this.orderRepo.findAll();
  }
}
