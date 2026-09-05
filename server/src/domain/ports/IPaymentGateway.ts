export interface PaymentConfig {
  publicKey: string;
  currency: string;
  baseFeeCents: number;
  shippingFeeCents: number;
}

export interface CardTokenizeInput {
  number: string;
  cvc: string;
  expMonth: string;
  expYear: string;
  cardHolder: string;
}

export interface CreateTransactionInput {
  amountInCents: number;
  currency: string;
  customerEmail: string;
  reference: string;
  cardToken: string;
  installments: number;
  redirectUrl: string;
  customerData: {
    fullName: string;
    phoneNumber: string;
    legalId: string;
    legalIdType: string;
  };
  shippingAddress?: {
    addressLine1: string;
    city: string;
    region: string;
    country: string;
    postalCode: string;
    phoneNumber: string;
    name: string;
  };
}

export interface TransactionResult {
  id: string;
  status: string;
  reference: string;
  amountInCents: number;
  currency: string;
  createdAt: string;
}

export interface IPaymentGateway {
  getConfig(): PaymentConfig;
  tokenizeCard(input: CardTokenizeInput): Promise<string>;
  createTransaction(input: CreateTransactionInput): Promise<TransactionResult>;
  getTransaction(wompiTxId: string): Promise<TransactionResult>;
  generateIntegritySignature(reference: string, amountInCents: number, currency: string): string;
}
