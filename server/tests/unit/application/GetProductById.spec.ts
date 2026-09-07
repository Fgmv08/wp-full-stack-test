import { GetProductById } from '@application/GetProductById';
import type { IProductRepository } from '@domain/ports/IProductRepository';
import type { Product } from '@domain/entities/Product';
import { AppError } from '@shared/errors/AppError';

describe('GetProductById Use Case', () => {
  let mockProductRepo: jest.Mocked<IProductRepository>;

  const mockProduct: Product = {
    id: 'prod-123',
    name: 'Reloj Inteligente',
    description: 'Reloj resistente al agua',
    priceCents: 15000000,
    stock: 5,
    imageUrl: 'http://example.com/reloj.png',
    category: 'Tecnología',
    createdAt: new Date(),
  };

  beforeEach(() => {
    mockProductRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      decrementStock: jest.fn(),
    };
  });

  it('debe retornar el producto cuando existe el ID solicitado', async () => {
    mockProductRepo.findById.mockResolvedValue(mockProduct);

    const useCase = new GetProductById(mockProductRepo);
    const result = await useCase.execute('prod-123');

    expect(mockProductRepo.findById).toHaveBeenCalledWith('prod-123');
    expect(result).toEqual(mockProduct);
  });

  it('debe lanzar AppError 404 (notFound) si el producto no existe', async () => {
    mockProductRepo.findById.mockResolvedValue(null);

    const useCase = new GetProductById(mockProductRepo);

    await expect(useCase.execute('non-existent-id')).rejects.toThrow(AppError);
    await expect(useCase.execute('non-existent-id')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Product not found',
    });
  });

  it('debe propagar errores de base de datos arrojados por el repositorio', async () => {
    mockProductRepo.findById.mockRejectedValue(new Error('Postgres query failure'));

    const useCase = new GetProductById(mockProductRepo);

    await expect(useCase.execute('prod-error')).rejects.toThrow('Postgres query failure');
  });
});
