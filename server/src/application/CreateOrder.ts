import type { IUserRepository } from '@domain/ports/IUserRepository';
import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { IPaymentGateway, CardTokenizeInput } from '@domain/ports/IPaymentGateway';
import type { Order } from '@domain/entities/Order';
import type { DeliveryInfo } from '@domain/entities/Order';
import { AppError } from '@shared/errors/AppError';
import { env } from '@shared/config/env';
import { cacheDel } from '@infrastructure/cache/RedisClient';

export interface CreateOrderInput {
  productId: string;
  card: CardTokenizeInput;
  deliveryInfo: DeliveryInfo;
  redirectUrl: string;
  installments?: number;
}

export interface CreateOrderResult {
  order: Order;
  wompiTransactionId: string;
  wompiStatus: string;
}

export class CreateOrder {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly productRepo: IProductRepository,
    private readonly orderRepo: IOrderRepository,
    private readonly paymentGateway: IPaymentGateway,
  ) {}

  async execute(input: CreateOrderInput): Promise<CreateOrderResult> {
    // 1. Validate user exists
    const user = await this.userRepo.findOne();
    if (!user) throw AppError.notFound('User');

    // 2. Validate product + stock
    const product = await this.productRepo.findById(input.productId);
    if (!product) throw AppError.notFound('Product');
    if (product.stock < 1) throw AppError.conflict('Product out of stock');

    // 3. Calculate amounts
    const totalAmountCents =
      product.priceCents + env.BASE_FEE_CENTS + env.SHIPPING_FEE_CENTS;

    // 4. Tokenize card (never persists card data)
    const cardToken = await this.paymentGateway.tokenizeCard(input.card);

    // 5. Create PENDING order
    const order = await this.orderRepo.create({
      userId: user.id,
      productIds: [product.id],
      totalAmountCents,
      baseFeeCents: env.BASE_FEE_CENTS,
      shippingFeeCents: env.SHIPPING_FEE_CENTS,
      deliveryInfo: input.deliveryInfo,
    });

    // 6. Create Wompi transaction
    const txResult = await this.paymentGateway.createTransaction({
      amountInCents: totalAmountCents,
      currency: env.CURRENCY,
      customerEmail: user.email,
      reference: order.id,
      cardToken,
      installments: input.installments ?? 1,
      redirectUrl: input.redirectUrl,
      customerData: {
        fullName: `${user.firstName} ${user.lastName}`,
        phoneNumber: user.phone,
        legalId: user.idNumber,
        legalIdType: user.idType,
      },
      shippingAddress: {
        addressLine1: input.deliveryInfo.address,
        city: input.deliveryInfo.city,
        region: input.deliveryInfo.department,
        country: 'CO',
        postalCode: input.deliveryInfo.postalCode,
        phoneNumber: input.deliveryInfo.recipientPhone,
        name: input.deliveryInfo.recipientName,
      },
    });

    // 7. Update order with Wompi transaction ID
    const updatedOrder = await this.orderRepo.updateStatus(
      order.id,
      txResult.status === 'APPROVED' ? 'APPROVED' : 'PENDING',
      txResult.id,
    );

    // 8. If approved, decrement stock and invalidate cache
    if (txResult.status === 'APPROVED') {
      await this.productRepo.decrementStock(product.id);
      await cacheDel('products:all');
    }

    return {
      order: updatedOrder,
      wompiTransactionId: txResult.id,
      wompiStatus: txResult.status,
    };
  }
}
