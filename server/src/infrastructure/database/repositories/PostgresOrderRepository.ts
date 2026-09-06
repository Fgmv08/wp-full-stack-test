import type { IOrderRepository, CreateOrderInput } from '@domain/ports/IOrderRepository';
import type { Order, OrderStatus, DeliveryInfo, CardSummary } from '@domain/entities/Order';
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
      reference: entity.reference,
      wompiTransactionId: entity.wompiTransactionId,
      totalAmountCents: entity.totalAmountCents,
      baseFeeCents: entity.baseFeeCents,
      shippingFeeCents: entity.shippingFeeCents,
      deliveryInfo: entity.deliveryInfo as DeliveryInfo | null,
      cardInfo: entity.cardInfo as CardSummary | null,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }

  async findAll(): Promise<Order[]> {
    const entities = await this.repo.find({
      order: { createdAt: 'DESC' },
      take: 50,
    });
    return entities.map((e) => this.toOrder(e));
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

  async findByReference(reference: string): Promise<Order | null> {
    const entity = await this.repo.findOneBy({ reference });
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
      reference: input.reference ?? null,
      wompiTransactionId: null,
      totalAmountCents: input.totalAmountCents,
      baseFeeCents: input.baseFeeCents,
      shippingFeeCents: input.shippingFeeCents,
      deliveryInfo: input.deliveryInfo,
      cardInfo: input.cardInfo ?? null,
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
