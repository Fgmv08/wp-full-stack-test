import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { IPaymentGateway } from '@domain/ports/IPaymentGateway';
import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { Order } from '@domain/entities/Order';
import { AppError } from '@shared/errors/AppError';
import { cacheDel } from '@infrastructure/cache/RedisClient';

export interface ConfirmPaymentResult {
  order: Order;
  wompiStatus: string;
}

export class ConfirmPayment {
  constructor(
    private readonly orderRepo: IOrderRepository,
    private readonly productRepo: IProductRepository,
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  async execute(wompiTransactionId: string): Promise<ConfirmPaymentResult> {
    // 1. Fetch transaction status from Wompi
    const txResult = await this.paymentGateway.getTransaction(wompiTransactionId);

    // 2. Find order by Wompi TX ID or by reference
    let order = await this.orderRepo.findByWompiTransactionId(wompiTransactionId);
    if (!order && txResult.reference) {
      order = await this.orderRepo.findByReference(txResult.reference);
    }
    if (!order) throw AppError.notFound('Order');

    // 3. Only process state change if still pending
    if (order.status !== 'PENDING') {
      return { order, wompiStatus: txResult.status };
    }

    // 4. Map Wompi status to our domain status
    type WompiStatus = 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED' | 'PENDING';
    const statusMap: Record<WompiStatus, 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED' | 'PENDING'> = {
      APPROVED: 'APPROVED',
      DECLINED: 'DECLINED',
      ERROR: 'ERROR',
      VOIDED: 'VOIDED',
      PENDING: 'PENDING',
    };
    const newStatus = statusMap[txResult.status as WompiStatus] ?? 'ERROR';

    // 5. Update order status and attach Wompi transaction id
    const updatedOrder = await this.orderRepo.updateStatus(order.id, newStatus, wompiTransactionId);

    // 6. If approved, decrement stock
    if (newStatus === 'APPROVED') {
      for (const productId of order.productIds) {
        try {
          await this.productRepo.decrementStock(productId);
        } catch {
          console.error(`Failed to decrement stock for product ${productId}`);
        }
      }
      await cacheDel('products:all');
    }

    return { order: updatedOrder, wompiStatus: txResult.status };
  }
}
