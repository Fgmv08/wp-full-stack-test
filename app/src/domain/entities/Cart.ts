import type { Product } from './Product'

export interface CartItem {
  product: Product
  quantity: number
}

export interface DeliveryInfo {
  address: string
  city: string
  department: string
  postalCode: string
  recipientName: string
  recipientPhone: string
}

export interface Cart {
  userId: string
  items: CartItem[]
  deliveryInfo: DeliveryInfo | null
}
