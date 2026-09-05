import { apiClient } from './apiClient'
import type { IPaymentRepository, CreateOrderInput, CreateOrderResult, TransactionResult } from '@/domain/ports/IPaymentRepository'
import type { PaymentConfig } from '@/domain/entities/Order'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export class HttpPaymentRepository implements IPaymentRepository {
  async getConfig(): Promise<PaymentConfig> {
    const { data } = await apiClient.get<ApiResponse<PaymentConfig>>('/payment/config')
    return data.data
  }

  async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
    const { data } = await apiClient.post<ApiResponse<CreateOrderResult>>('/payment/create-order', input)
    return data.data
  }

  async confirmPayment(wompiTransactionId: string): Promise<TransactionResult> {
    const { data } = await apiClient.post<ApiResponse<TransactionResult>>('/payment/confirm', { wompiTransactionId })
    return data.data
  }

  async getTransaction(wompiTransactionId: string): Promise<TransactionResult> {
    const { data } = await apiClient.get<ApiResponse<TransactionResult>>(`/payment/transaction/${wompiTransactionId}`)
    return data.data
  }
}
