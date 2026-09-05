import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { Product } from '@domain/entities/Product';
import type { DataSource } from 'typeorm';
import { ProductEntity } from '../entities/ProductEntity';
import { AppError } from '@shared/errors/AppError';

export class PostgresProductRepository implements IProductRepository {
  private readonly repo;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(ProductEntity);
  }

  private toProduct(entity: ProductEntity): Product {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description,
      priceCents: entity.priceCents,
      stock: entity.stock,
      imageUrl: entity.imageUrl,
      category: entity.category,
      createdAt: entity.createdAt,
    };
  }

  async findAll(): Promise<Product[]> {
    const entities = await this.repo.find({ order: { createdAt: 'ASC' } });
    return entities.map(this.toProduct);
  }

  async findById(id: string): Promise<Product | null> {
    const entity = await this.repo.findOneBy({ id });
    return entity ? this.toProduct(entity) : null;
  }

  async decrementStock(id: string, quantity = 1): Promise<void> {
    const product = await this.repo.findOneBy({ id });
    if (!product) throw AppError.notFound('Product');
    if (product.stock < quantity) {
      throw AppError.conflict(`Insufficient stock for product ${product.name}`);
    }
    await this.repo.decrement({ id }, 'stock', quantity);
  }
}
