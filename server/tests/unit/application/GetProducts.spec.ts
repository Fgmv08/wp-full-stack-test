import { GetProducts } from '@application/GetProducts';
import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { Product } from '@domain/entities/Product';
import * as RedisClient from '@infrastructure/cache/RedisClient';

describe('GetProducts Use Case', () => {
  let mockProductRepo: jest.Mocked<IProductRepository>;
  let cacheGetSpy: jest.SpyInstance;
  let cacheSetSpy: jest.SpyInstance;

  const sampleProducts: Product[] = [
    {
      id: 'prod-1',
      name: 'Camisa Elegante',
      description: 'Camisa de algodón',
      priceCents: 12000000,
      stock: 15,
      imageUrl: 'http://example.com/camisa.png',
      category: 'Ropa',
      createdAt: new Date(),
    },
    {
      id: 'prod-2',
      name: 'Zapatos Deportivos',
      description: 'Zapatos para running',
      priceCents: 25000000,
      stock: 8,
      imageUrl: 'http://example.com/zapatos.png',
      category: 'Calzado',
      createdAt: new Date(),
    },
  ];

  beforeEach(() => {
    mockProductRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decrementStock: jest.fn(),
    };

    cacheGetSpy = jest.spyOn(RedisClient, 'cacheGet');
    cacheSetSpy = jest.spyOn(RedisClient, 'cacheSet').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('debe retornar productos desde la base de datos y guardarlos en caché cuando no hay caché', async () => {
    cacheGetSpy.mockResolvedValue(null);
    mockProductRepo.findAll.mockResolvedValue(sampleProducts);

    const useCase = new GetProducts(mockProductRepo);
    const result = await useCase.execute();

    expect(cacheGetSpy).toHaveBeenCalledWith('products:all');
    expect(mockProductRepo.findAll).toHaveBeenCalledTimes(1);
    expect(cacheSetSpy).toHaveBeenCalledWith('products:all', sampleProducts, 120);
    expect(result).toEqual(sampleProducts);
  });

  it('debe retornar productos desde la caché de Redis sin consultar el repositorio', async () => {
    cacheGetSpy.mockResolvedValue(sampleProducts);

    const useCase = new GetProducts(mockProductRepo);
    const result = await useCase.execute();

    expect(cacheGetSpy).toHaveBeenCalledWith('products:all');
    expect(mockProductRepo.findAll).not.toHaveBeenCalled();
    expect(cacheSetSpy).not.toHaveBeenCalled();
    expect(result).toEqual(sampleProducts);
  });

  it('debe retornar un arreglo vacío si no existen productos en la base de datos', async () => {
    cacheGetSpy.mockResolvedValue(null);
    mockProductRepo.findAll.mockResolvedValue([]);

    const useCase = new GetProducts(mockProductRepo);
    const result = await useCase.execute();

    expect(result).toEqual([]);
    expect(cacheSetSpy).toHaveBeenCalledWith('products:all', [], 120);
  });

  it('debe propagar el error si el repositorio falla al consultar la base de datos', async () => {
    cacheGetSpy.mockResolvedValue(null);
    mockProductRepo.findAll.mockRejectedValue(new Error('DB connection timeout'));

    const useCase = new GetProducts(mockProductRepo);

    await expect(useCase.execute()).rejects.toThrow('DB connection timeout');
  });
});
