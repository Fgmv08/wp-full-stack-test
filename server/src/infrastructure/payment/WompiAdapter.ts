import axios from 'axios';
import type {
  IPaymentGateway,
  PaymentConfig,
  CardTokenizeInput,
  CreateTransactionInput,
  TransactionResult,
} from '@domain/ports/IPaymentGateway';
import { env } from '@shared/config/env';
import { generateWompiSignature } from '@shared/utils/integrity';
import { AppError } from '@shared/errors/AppError';

export class WompiAdapter implements IPaymentGateway {
  private readonly apiUrl: string;
  private readonly publicKey: string;
  private readonly privateKey: string;
  private readonly integrityKey: string;

  constructor() {
    this.apiUrl = env.PAYMENT_API_URL;
    this.publicKey = env.PAYMENT_PUBLIC_KEY;
    this.privateKey = env.PAYMENT_PRIVATE_KEY;
    this.integrityKey = env.PAYMENT_INTEGRITY_KEY;
  }

  getConfig(): PaymentConfig {
    return {
      publicKey: this.publicKey,
      currency: env.CURRENCY,
      baseFeeCents: env.BASE_FEE_CENTS,
      shippingFeeCents: env.SHIPPING_FEE_CENTS,
    };
  }

  generateIntegritySignature(reference: string, amountInCents: number, currency: string): string {
    return generateWompiSignature(reference, amountInCents, currency, this.integrityKey);
  }

  async tokenizeCard(input: CardTokenizeInput): Promise<string> {
    try {
      const response = await axios.post(
        `${this.apiUrl}/tokens/cards`,
        {
          number: input.number,
          cvc: input.cvc,
          exp_month: input.expMonth,
          exp_year: input.expYear,
          card_holder: input.cardHolder,
        },
        {
          headers: {
            Authorization: `Bearer ${this.publicKey}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.data.id as string;
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { messages?: Record<string, string[]> } } } };
      const messages = error.response?.data?.error?.messages;
      const detail = messages ? JSON.stringify(messages) : 'Card tokenization failed';
      throw AppError.badRequest(`Payment error: ${detail}`);
    }
  }

  async createTransaction(input: CreateTransactionInput): Promise<TransactionResult> {
    try {
      const signature = this.generateIntegritySignature(
        input.reference,
        input.amountInCents,
        input.currency,
      );

      const response = await axios.post(
        `${this.apiUrl}/transactions`,
        {
          amount_in_cents: input.amountInCents,
          currency: input.currency,
          customer_email: input.customerEmail,
          reference: input.reference,
          signature,
          redirect_url: input.redirectUrl,
          payment_method: {
            type: 'CARD',
            installments: input.installments,
            token: input.cardToken,
          },
          customer_data: {
            full_name: input.customerData.fullName,
            phone_number: input.customerData.phoneNumber,
            legal_id: input.customerData.legalId,
            legal_id_type: input.customerData.legalIdType,
          },
          shipping_address: input.shippingAddress
            ? {
                address_line_1: input.shippingAddress.addressLine1,
                city: input.shippingAddress.city,
                region: input.shippingAddress.region,
                country: input.shippingAddress.country,
                postal_code: input.shippingAddress.postalCode,
                phone_number: input.shippingAddress.phoneNumber,
                name: input.shippingAddress.name,
              }
            : undefined,
        },
        {
          headers: {
            Authorization: `Bearer ${this.privateKey}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const tx = response.data.data;
      return {
        id: tx.id,
        status: tx.status,
        reference: tx.reference,
        amountInCents: tx.amount_in_cents,
        currency: tx.currency,
        createdAt: tx.created_at,
      };
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: { messages?: Record<string, string[]> } }; status?: number } };
      if (error.response?.status === 422) {
        const messages = error.response.data?.error?.messages;
        throw AppError.badRequest(`Transaction error: ${JSON.stringify(messages)}`);
      }
      throw AppError.internal('Failed to create transaction with payment provider');
    }
  }

  async getTransaction(wompiTxId: string): Promise<TransactionResult> {
    try {
      const response = await axios.get(`${this.apiUrl}/transactions/${wompiTxId}`, {
        headers: {
          Authorization: `Bearer ${this.privateKey}`,
        },
      });
      const tx = response.data.data;
      return {
        id: tx.id,
        status: tx.status,
        reference: tx.reference,
        amountInCents: tx.amount_in_cents,
        currency: tx.currency,
        createdAt: tx.created_at,
      };
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        throw AppError.notFound('Transaction');
      }
      throw AppError.internal('Failed to fetch transaction from payment provider');
    }
  }
}
