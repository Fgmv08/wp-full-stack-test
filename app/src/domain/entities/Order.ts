export type OrderStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED'

export interface Order {
  id: string
  userId: string
  productIds: string[]
  status: OrderStatus
  wompiTransactionId: string | null
  totalAmountCents: number
  baseFeeCents: number
  shippingFeeCents: number
  deliveryInfo?: {
    address: string
    city: string
    department: string
    postalCode: string
    recipientName: string
    recipientPhone: string
  }
  createdAt: string
  updatedAt: string
}

export interface PaymentConfig {
  publicKey: string
  currency: string
  baseFeeCents: number
  shippingFeeCents: number
}

export interface CardInfo {
  number: string
  cvc: string
  expMonth: string
  expYear: string
  cardHolder: string
}
