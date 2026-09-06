export type OrderStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'ERROR' | 'VOIDED';

export interface DeliveryInfo {
  address: string;
  city: string;
  department: string;
  postalCode: string;
  recipientName: string;
  recipientPhone: string;
}

export interface CardSummary {
  brand: string;
  lastFour: string;
  cardHolder: string;
  expMonth?: string;
  expYear?: string;
}

export interface Order {
  id: string;
  userId: string;
  productIds: string[];
  status: OrderStatus;
  reference: string | null;
  wompiTransactionId: string | null;
  totalAmountCents: number;
  baseFeeCents: number;
  shippingFeeCents: number;
  deliveryInfo: DeliveryInfo | null;
  cardInfo: CardSummary | null;
  createdAt: Date;
  updatedAt: Date;
}
