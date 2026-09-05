import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { Product } from '@domain/entities/Product';
import { AppError } from '@shared/errors/AppError';

export class GetProductById {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(id: string): Promise<Product> {
    const product = await this.productRepo.findById(id);
    if (!product) throw AppError.notFound('Product');
    return product;
  }
}
