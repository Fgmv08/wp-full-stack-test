import type { Order, PaymentConfig, CardInfo } from '../entities/Order'
import type { DeliveryInfo } from '../entities/Cart'

export interface CreateOrderInput {
  productId: string
  card: CardInfo
  deliveryInfo: DeliveryInfo
  redirectUrl: string
  installments?: number
}

export interface CreateOrderResult {
  order: Order
  wompiTransactionId: string
  wompiStatus: string
}

export interface TransactionResult {
  order: Order
  wompiStatus: string
  wompiTransactionId: string
}

export interface IPaymentRepository {
  getConfig(): Promise<PaymentConfig>
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>
  confirmPayment(wompiTransactionId: string): Promise<TransactionResult>
  getTransaction(wompiTransactionId: string): Promise<TransactionResult>
}
