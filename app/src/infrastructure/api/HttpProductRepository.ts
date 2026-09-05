import { apiClient } from './apiClient'
import type { IProductRepository } from '@/domain/ports/IProductRepository'
import type { Product } from '@/domain/entities/Product'

export class HttpProductRepository implements IProductRepository {
  async getAll(): Promise<Product[]> {
    const { data } = await apiClient.get<{ success: boolean; data: Product[] }>('/products')
    return data.data
  }

  async getById(id: string): Promise<Product> {
    const { data } = await apiClient.get<{ success: boolean; data: Product }>(`/products/${id}`)
    return data.data
  }
}
