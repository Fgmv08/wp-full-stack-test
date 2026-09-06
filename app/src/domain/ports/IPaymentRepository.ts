import type { Order, PaymentConfig, CardInfo } from '../entities/Order'
import type { DeliveryInfo } from '../entities/Cart'

export interface CreateOrderInput {
  productId: string
  card: CardInfo
  deliveryInfo: DeliveryInfo
  redirectUrl?: string
  installments?: number
}

export interface WompiCustomerData {
  email: string
  fullName: string
  phoneNumber: string
  phoneNumberPrefix: string
  legalId: string
  legalIdType: string
}

export interface WompiShippingAddress {
  addressLine1: string
  city: string
  phoneNumber: string
  region: string
  country: string
  postalCode?: string
}

export interface DataPaymentResult {
  reference: string
  amountInCents: number
  currency: string
  signature: {
    integrity: string
  }
  publicKey: string
  redirectUrl: string
  customerData: WompiCustomerData
  shippingAddress: WompiShippingAddress
  orderId: string
  product: {
    id: string
    name: string
    priceCents: number
  }
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
  getDataPayment(input: CreateOrderInput): Promise<DataPaymentResult>
  getOrders(): Promise<Order[]>
  createOrder(input: CreateOrderInput): Promise<CreateOrderResult>
  confirmPayment(wompiTransactionId: string): Promise<TransactionResult>
  getTransaction(wompiTransactionId: string): Promise<TransactionResult>
}
