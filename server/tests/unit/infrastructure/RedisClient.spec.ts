describe('RedisClient Infrastructure', () => {
  let RedisClientModule: typeof import('@infrastructure/cache/RedisClient');
  let mockRedisInstance: {
    get: jest.Mock;
    setex: jest.Mock;
    del: jest.Mock;
    quit: jest.Mock;
    disconnect: jest.Mock;
    on: jest.Mock;
  };
  let MockRedisConstructor: jest.Mock;

  beforeEach(() => {
    jest.resetModules();

    mockRedisInstance = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn(),
      on: jest.fn(),
    };

    MockRedisConstructor = jest.fn().mockImplementation(() => mockRedisInstance);

    jest.doMock('ioredis', () => {
      return MockRedisConstructor;
    });

    RedisClientModule = require('@infrastructure/cache/RedisClient');
  });

  afterEach(async () => {
    if (RedisClientModule) {
      await RedisClientModule.closeRedisClient();
    }
  });

  describe('getRedisClient() & Connection handlers', () => {
    it('debe instanciar el cliente Redis con retryStrategy y registrar eventos connect y error', () => {
      const client = RedisClientModule.getRedisClient();
      expect(client).toBeDefined();
      expect(MockRedisConstructor).toHaveBeenCalledTimes(1);

      // Evaluar la función retryStrategy configurada
      const constructorOptions = MockRedisConstructor.mock.calls[0][0];
      expect(constructorOptions.retryStrategy(1)).toBe(500);
      expect(constructorOptions.retryStrategy(2)).toBe(1000);
      expect(constructorOptions.retryStrategy(5)).toBeNull(); // Detiene tras más de 3 intentos

      // Evaluar callbacks de connect y error
      expect(mockRedisInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(mockRedisInstance.on).toHaveBeenCalledWith('error', expect.any(Function));

      const connectHandler = mockRedisInstance.on.mock.calls.find((c) => c[0] === 'connect')[1];
      const errorHandler = mockRedisInstance.on.mock.calls.find((c) => c[0] === 'error')[1];

      expect(() => connectHandler()).not.toThrow();
      expect(() => errorHandler(new Error('Connection lost'))).not.toThrow();
    });

    it('debe reutilizar la misma instancia si ya fue creada (Singleton)', () => {
      const client1 = RedisClientModule.getRedisClient();
      const client2 = RedisClientModule.getRedisClient();

      expect(client1).toBe(client2);
      expect(MockRedisConstructor).toHaveBeenCalledTimes(1);
    });
  });

  describe('cacheGet()', () => {
    it('debe retornar el objeto parseado cuando existe en caché', async () => {
      const sample = { id: 'p1', name: 'Zapatos' };
      mockRedisInstance.get.mockResolvedValue(JSON.stringify(sample));

      const result = await RedisClientModule.cacheGet<{ id: string; name: string }>('products:p1');

      expect(mockRedisInstance.get).toHaveBeenCalledWith('products:p1');
      expect(result).toEqual(sample);
    });

    it('debe retornar null cuando la clave no existe en Redis', async () => {
      mockRedisInstance.get.mockResolvedValue(null);

      const result = await RedisClientModule.cacheGet('products:inexistente');

      expect(mockRedisInstance.get).toHaveBeenCalledWith('products:inexistente');
      expect(result).toBeNull();
    });

    it('debe capturar errores de conexión o lectura y retornar null de manera segura', async () => {
      mockRedisInstance.get.mockRejectedValue(new Error('Redis timeout connection'));

      const result = await RedisClientModule.cacheGet('test:key');

      expect(result).toBeNull();
    });
  });

  describe('cacheSet()', () => {
    it('debe almacenar en Redis con TTL por defecto de 300 segundos', async () => {
      mockRedisInstance.setex.mockResolvedValue('OK');

      await RedisClientModule.cacheSet('key:default', { foo: 'bar' });

      expect(mockRedisInstance.setex).toHaveBeenCalledWith('key:default', 300, JSON.stringify({ foo: 'bar' }));
    });

    it('debe almacenar en Redis con TTL personalizado', async () => {
      mockRedisInstance.setex.mockResolvedValue('OK');

      await RedisClientModule.cacheSet('key:custom', { foo: 'bar' }, 60);

      expect(mockRedisInstance.setex).toHaveBeenCalledWith('key:custom', 60, JSON.stringify({ foo: 'bar' }));
    });

    it('debe manejar errores de Redis silenciosamente sin lanzar excepción hacia afuera', async () => {
      mockRedisInstance.setex.mockRejectedValue(new Error('Write failed'));

      await expect(RedisClientModule.cacheSet('key:fail', { foo: 'bar' })).resolves.not.toThrow();
    });
  });

  describe('cacheDel()', () => {
    it('debe eliminar la clave de Redis exitosamente', async () => {
      mockRedisInstance.del.mockResolvedValue(1);

      await RedisClientModule.cacheDel('products:all');

      expect(mockRedisInstance.del).toHaveBeenCalledWith('products:all');
    });

    it('debe capturar errores en eliminación sin interrumpir el flujo', async () => {
      mockRedisInstance.del.mockRejectedValue(new Error('Delete error'));

      await expect(RedisClientModule.cacheDel('products:all')).resolves.not.toThrow();
    });
  });

  describe('closeRedisClient()', () => {
    it('debe cerrar la conexión llamando a quit() cuando redisClient está activo', async () => {
      RedisClientModule.getRedisClient();
      await RedisClientModule.closeRedisClient();

      expect(mockRedisInstance.quit).toHaveBeenCalledTimes(1);
    });

    it('debe llamar a disconnect() si quit() falla', async () => {
      RedisClientModule.getRedisClient();
      mockRedisInstance.quit.mockRejectedValue(new Error('Quit rejected'));

      await RedisClientModule.closeRedisClient();

      expect(mockRedisInstance.disconnect).toHaveBeenCalledTimes(1);
    });

    it('no debe hacer nada si redisClient es null', async () => {
      await expect(RedisClientModule.closeRedisClient()).resolves.not.toThrow();
    });
  });
});
