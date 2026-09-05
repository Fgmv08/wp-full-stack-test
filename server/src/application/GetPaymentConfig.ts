import type { IPaymentGateway, PaymentConfig } from '@domain/ports/IPaymentGateway';

export class GetPaymentConfig {
  constructor(private readonly paymentGateway: IPaymentGateway) {}

  execute(): PaymentConfig {
    return this.paymentGateway.getConfig();
  }
}
