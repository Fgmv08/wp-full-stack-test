import express from 'express';
import request from 'supertest';
import { errorHandler } from '@interfaces/http/middleware/errorHandler';
import { AppError } from '@shared/errors/AppError';
import { z, ZodError } from 'zod';

describe('errorHandler Middleware (Supertest)', () => {
  let app: express.Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Rutas para simular distintos tipos de errores
    app.get('/test-app-error', () => {
      throw AppError.notFound('Recurso');
    });

    app.get('/test-bad-request', () => {
      throw AppError.badRequest('Datos inconsistentes');
    });

    app.post('/test-zod-error', (req) => {
      const schema = z.object({
        email: z.string().email(),
        amount: z.number().positive(),
      });
      schema.parse(req.body);
    });

    app.get('/test-internal-error', () => {
      throw new Error('Explosión no controlada');
    });

    app.use(errorHandler);
  });

  it('debe responder con 404 estructurado cuando se lanza AppError.notFound', async () => {
    const res = await request(app).get('/test-app-error');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        message: 'Recurso not found',
        statusCode: 404,
      },
    });
  });

  it('debe responder con 400 estructurado cuando se lanza AppError.badRequest', async () => {
    const res = await request(app).get('/test-bad-request');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      success: false,
      error: {
        message: 'Datos inconsistentes',
        statusCode: 400,
      },
    });
  });

  it('debe responder con 400 y detalles cuando se lanza un error de validación Zod', async () => {
    const res = await request(app)
      .post('/test-zod-error')
      .send({ email: 'correo-invalido', amount: -10 });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.message).toBe('Validation error');
    expect(res.body.error.statusCode).toBe(400);
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThan(0);
  });

  it('debe responder con 500 genérico y ocultar trazas de error en excepciones inesperadas', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const res = await request(app).get('/test-internal-error');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      success: false,
      error: {
        message: 'Internal server error',
        statusCode: 500,
      },
    });

    consoleSpy.mockRestore();
  });
});
