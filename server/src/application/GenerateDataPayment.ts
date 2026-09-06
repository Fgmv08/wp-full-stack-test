import crypto from 'crypto';
import type { IUserRepository } from '@domain/ports/IUserRepository';
import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { IOrderRepository } from '@domain/ports/IOrderRepository';
import type { DeliveryInfo, CardSummary } from '@domain/entities/Order';
import { AppError } from '@shared/errors/AppError';
import { env } from '@shared/config/env';

export interface CardInput {
  number: string;
  cardHolder: string;
  expMonth: string;
  expYear: string;
  cvc?: string;
  brand?: string;
}

export interface GenerateDataPaymentInput {
  productId: string;
  deliveryInfo: DeliveryInfo;
  card: CardInput;
  redirectUrl?: string;
  installments?: number;
}

export interface WompiCustomerData {
  email: string;
  fullName: string;
  phoneNumber: string;
  phoneNumberPrefix: string;
  legalId: string;
  legalIdType: string;
}

export interface WompiShippingAddress {
  addressLine1: string;
  city: string;
  phoneNumber: string;
  region: string;
  country: string;
  postalCode?: string;
}

export interface GenerateDataPaymentResult {
  reference: string;
  amountInCents: number;
  currency: string;
  signature: {
    integrity: string;
  };
  publicKey: string;
  redirectUrl: string;
  customerData: WompiCustomerData;
  shippingAddress: WompiShippingAddress;
  orderId: string;
  product: {
    id: string;
    name: string;
    priceCents: number;
  };
}

export class GenerateDataPayment {
  constructor(
    private readonly userRepo: IUserRepository,
    private readonly productRepo: IProductRepository,
    private readonly orderRepo: IOrderRepository,
  ) {}

  async execute(input: GenerateDataPaymentInput): Promise<GenerateDataPaymentResult> {
    // 1. Get or validate user
    const user = await this.userRepo.findOne();
    if (!user) throw AppError.notFound('User');

    // 2. Validate product
    const product = await this.productRepo.findById(input.productId);
    if (!product) throw AppError.notFound('Product');
    if (product.stock < 1) throw AppError.conflict('El producto está agotado');

    // 3. Compute total amount in cents
    const totalAmountCents = product.priceCents + env.BASE_FEE_CENTS + env.SHIPPING_FEE_CENTS;

    // 4. Generate unique reference
    const reference = `REF_${Date.now()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    // 5. Generate SHA-256 integrity signature
    // Formato Wompi: <Referencia><MontoEnCentavos><Moneda><SecretoIntegridad>
    const integritySecret = env.PAYMENT_INTEGRITY_KEY;
    const cadena = `${reference}${totalAmountCents}${env.CURRENCY}${integritySecret}`;
    const hashHex = crypto.createHash('sha256').update(cadena).digest('hex');

    // 6. Mask card info for database storage
    const cleanNumber = input.card.number.replace(/\s+/g, '');
    const lastFour = cleanNumber.slice(-4) || '0000';
    const cardSummary: CardSummary = {
      brand: input.card.brand || (cleanNumber.startsWith('4') ? 'VISA' : 'MASTERCARD'),
      lastFour,
      cardHolder: input.card.cardHolder,
      expMonth: input.card.expMonth,
      expYear: input.card.expYear,
    };

    // 7. Create PENDING order with reference in DB
    const order = await this.orderRepo.create({
      userId: user.id,
      productIds: [product.id],
      totalAmountCents,
      baseFeeCents: env.BASE_FEE_CENTS,
      shippingFeeCents: env.SHIPPING_FEE_CENTS,
      deliveryInfo: input.deliveryInfo,
      reference,
      cardInfo: cardSummary,
    });

    const redirectUrl = input.redirectUrl || `${env.CORS_ORIGIN}/payment-result`;

    const customerData: WompiCustomerData = {
      email: user.email,
      fullName: input.deliveryInfo.recipientName || `${user.firstName} ${user.lastName}`,
      phoneNumber: input.deliveryInfo.recipientPhone || user.phone,
      phoneNumberPrefix: '+57',
      legalId: user.idNumber,
      legalIdType: user.idType,
    };

    const shippingAddress: WompiShippingAddress = {
      addressLine1: input.deliveryInfo.address,
      city: input.deliveryInfo.city,
      phoneNumber: input.deliveryInfo.recipientPhone || user.phone,
      region: input.deliveryInfo.department,
      country: 'CO',
      postalCode: input.deliveryInfo.postalCode,
    };

    return {
      reference,
      amountInCents: totalAmountCents,
      currency: env.CURRENCY,
      signature: {
        integrity: hashHex,
      },
      publicKey: env.PAYMENT_PUBLIC_KEY,
      redirectUrl,
      customerData,
      shippingAddress,
      orderId: order.id,
      product: {
        id: product.id,
        name: product.name,
        priceCents: product.priceCents,
      },
    };
  }
}
