import type { IOrderRepository, CreateOrderInput } from '@domain/ports/IOrderRepository';
import type { Order, OrderStatus, DeliveryInfo } from '@domain/entities/Order';
import type { DataSource } from 'typeorm';
import { OrderEntity } from '../entities/OrderEntity';

export class PostgresOrderRepository implements IOrderRepository {
  private readonly repo;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(OrderEntity);
  }

  private toOrder(entity: OrderEntity): Order {
    return {
      id: entity.id,
      userId: entity.userId,
      productIds: entity.productIds,
      status: entity.status,
      wompiTransactionId: entity.wompiTransactionId,
      totalAmountCents: entity.totalAmountCents,
      baseFeeCents: entity.baseFeeCents,
      shippingFeeCents: entity.shippingFeeCents,
      deliveryInfo: entity.deliveryInfo as DeliveryInfo | null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async findByUserId(userId: string): Promise<Order | null> {
    const entity = await this.repo.findOne({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
    return entity ? this.toOrder(entity) : null;
  }

  async findById(id: string): Promise<Order | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toOrder(entity) : null;
  }

  async findByWompiTransactionId(wompiTxId: string): Promise<Order | null> {
    const entity = await this.repo.findOneBy({ wompiTransactionId: wompiTxId });
    return entity ? this.toOrder(entity) : null;
  }

  async create(input: CreateOrderInput): Promise<Order> {
    const entity = this.repo.create({
      userId: input.userId,
      productIds: input.productIds,
      status: 'PENDING',
      wompiTransactionId: null,
      totalAmountCents: input.totalAmountCents,
      baseFeeCents: input.baseFeeCents,
      shippingFeeCents: input.shippingFeeCents,
      deliveryInfo: input.deliveryInfo,
    });
    const saved = await this.repo.save(entity);
    return this.toOrder(saved);
  }

  async updateStatus(id: string, status: OrderStatus, wompiTxId?: string): Promise<Order> {
    await this.repo.update(id, {
      status,
      ...(wompiTxId ? { wompiTransactionId: wompiTxId } : {}),
    });
    const updated = await this.repo.findOneByOrFail({ id });
    return this.toOrder(updated);
  }
}
