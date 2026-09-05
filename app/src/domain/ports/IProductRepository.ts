import type { Product } from '../entities/Product'

export interface IProductRepository {
  getAll(): Promise<Product[]>
  getById(id: string): Promise<Product>
}
