import type { Order, OrderStatus, DeliveryInfo } from '../entities/Order';

export interface CreateOrderInput {
  userId: string;
  productIds: string[];
  totalAmountCents: number;
  baseFeeCents: number;
  shippingFeeCents: number;
  deliveryInfo: DeliveryInfo;
}

export interface IOrderRepository {
  findByUserId(userId: string): Promise<Order | null>;
  findById(id: string): Promise<Order | null>;
  findByWompiTransactionId(wompiTxId: string): Promise<Order | null>;
  create(input: CreateOrderInput): Promise<Order>;
  updateStatus(id: string, status: OrderStatus, wompiTxId?: string): Promise<Order>;
}
