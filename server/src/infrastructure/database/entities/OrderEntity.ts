import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { OrderStatus, DeliveryInfo, CardSummary } from '@domain/entities/Order';

@Entity('orders')
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId!: string;

  @Column({ name: 'product_ids', type: 'jsonb' })
  productIds!: string[];

  @Column({
    type: 'enum',
    enum: ['PENDING', 'APPROVED', 'DECLINED', 'ERROR', 'VOIDED'],
    default: 'PENDING',
  })
  status!: OrderStatus;

  @Column({ name: 'reference', type: 'varchar', nullable: true })
  reference!: string | null;

  @Column({ name: 'wompi_transaction_id', type: 'varchar', nullable: true })
  wompiTransactionId!: string | null;

  @Column({ name: 'total_amount_cents', type: 'integer' })
  totalAmountCents!: number;

  @Column({ name: 'base_fee_cents', type: 'integer' })
  baseFeeCents!: number;

  @Column({ name: 'shipping_fee_cents', type: 'integer' })
  shippingFeeCents!: number;

  @Column({ name: 'delivery_info', type: 'jsonb', nullable: true })
  deliveryInfo!: DeliveryInfo | null;

  @Column({ name: 'card_info', type: 'jsonb', nullable: true })
  cardInfo!: CardSummary | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
