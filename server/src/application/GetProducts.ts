import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { Product } from '@domain/entities/Product';
import { cacheGet, cacheSet } from '@infrastructure/cache/RedisClient';

const CACHE_KEY = 'products:all';
const CACHE_TTL = 120; // 2 minutes

export class GetProducts {
  constructor(private readonly productRepo: IProductRepository) {}

  async execute(): Promise<Product[]> {
    const cached = await cacheGet<Product[]>(CACHE_KEY);
    if (cached) return cached;

    const products = await this.productRepo.findAll();
    await cacheSet(CACHE_KEY, products, CACHE_TTL);
    return products;
  }
}
