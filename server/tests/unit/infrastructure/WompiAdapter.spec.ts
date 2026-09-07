import { WompiAdapter } from '@infrastructure/payment/WompiAdapter';
import axios from 'axios';
import { env } from '@shared/config/env';
import { AppError } from '@shared/errors/AppError';
import type { CreateTransactionInput } from '@domain/ports/IPaymentGateway';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WompiAdapter Infrastructure', () => {
  let adapter: WompiAdapter;

  const validTxInput: CreateTransactionInput = {
    amountInCents: 15000000,
    currency: 'COP',
    customerEmail: 'juan@example.com',
    reference: 'REF_TEST_TX_1',
    cardToken: 'tok_stagtest_card_123',
    installments: 1,
    redirectUrl: 'http://localhost:5000/result',
    customerData: {
      fullName: 'Juan Pérez',
      phoneNumber: '3001234567',
      legalId: '1098765432',
      legalIdType: 'CC',
    },
    shippingAddress: {
      addressLine1: 'Calle 10 # 5-20',
      city: 'Bogotá',
      region: 'Cundinamarca',
      country: 'CO',
      postalCode: '110111',
      phoneNumber: '3001234567',
      name: 'Juan Pérez',
    },
  };

  beforeEach(() => {
    adapter = new WompiAdapter();
    jest.clearAllMocks();
  });

  describe('getConfig()', () => {
    it('debe retornar la configuración pública de Wompi correctamente', () => {
      const config = adapter.getConfig();

      expect(config).toEqual({
        publicKey: env.PAYMENT_PUBLIC_KEY,
        currency: env.CURRENCY,
        baseFeeCents: env.BASE_FEE_CENTS,
        shippingFeeCents: env.SHIPPING_FEE_CENTS,
      });
    });
  });

  describe('generateIntegritySignature()', () => {
    it('debe generar la firma SHA-256 válida con la referencia, monto y moneda', () => {
      const signature = adapter.generateIntegritySignature('REF_123', 10000000, 'COP');
      expect(typeof signature).toBe('string');
      expect(signature.length).toBe(64); // SHA-256 hex length
    });
  });

  describe('tokenizeCard()', () => {
    it('debe retornar el token de tarjeta cuando Wompi responde exitosamente', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            id: 'tok_stagtest_card_123',
            status: 'CREATED',
          },
        },
      });

      const token = await adapter.tokenizeCard({
        number: '4242424242424242',
        cvc: '123',
        expMonth: '12',
        expYear: '28',
        cardHolder: 'Pedro Pascal',
      });

      expect(token).toBe('tok_stagtest_card_123');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${env.PAYMENT_API_URL}/tokens/cards`,
        expect.objectContaining({
          number: '4242424242424242',
          cvc: '123',
          exp_month: '12',
          exp_year: '28',
          card_holder: 'Pedro Pascal',
        }),
        expect.any(Object),
      );
    });

    it('debe lanzar AppError 400 formateando los mensajes de error devueltos por Wompi', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          data: {
            error: {
              messages: {
                number: ['El número de tarjeta no es válido'],
              },
            },
          },
        },
      });

      await expect(
        adapter.tokenizeCard({
          number: '0000000000000',
          cvc: '000',
          expMonth: '01',
          expYear: '20',
          cardHolder: 'Invalido',
        }),
      ).rejects.toThrow('Payment error: {"number":["El número de tarjeta no es válido"]}');
    });

    it('debe lanzar AppError 400 genérico si Wompi falla sin bloque de mensajes detallado', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        adapter.tokenizeCard({
          number: '4242424242424242',
          cvc: '123',
          expMonth: '12',
          expYear: '28',
          cardHolder: 'Invalido',
        }),
      ).rejects.toThrow('Payment error: Card tokenization failed');
    });
  });

  describe('createTransaction()', () => {
    it('debe crear la transacción con dirección de envío y retornar TransactionResult', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            id: 'tx_wompi_001',
            status: 'PENDING',
            reference: validTxInput.reference,
            amount_in_cents: validTxInput.amountInCents,
            currency: validTxInput.currency,
            created_at: '2026-09-01T10:00:00.000Z',
          },
        },
      });

      const result = await adapter.createTransaction(validTxInput);

      expect(result).toEqual({
        id: 'tx_wompi_001',
        status: 'PENDING',
        reference: validTxInput.reference,
        amountInCents: validTxInput.amountInCents,
        currency: validTxInput.currency,
        createdAt: '2026-09-01T10:00:00.000Z',
      });
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${env.PAYMENT_API_URL}/transactions`,
        expect.objectContaining({
          shipping_address: expect.objectContaining({
            address_line_1: 'Calle 10 # 5-20',
            city: 'Bogotá',
          }),
        }),
        expect.any(Object),
      );
    });

    it('debe crear la transacción omitiendo shippingAddress si no viene provista', async () => {
      mockedAxios.post.mockResolvedValueOnce({
        data: {
          data: {
            id: 'tx_wompi_002',
            status: 'APPROVED',
            reference: 'REF_NO_SHIPPING',
            amount_in_cents: 5000000,
            currency: 'COP',
            created_at: '2026-09-01T10:00:00.000Z',
          },
        },
      });

      const inputWithoutShipping = { ...validTxInput, shippingAddress: undefined };
      const result = await adapter.createTransaction(inputWithoutShipping);

      expect(result.id).toBe('tx_wompi_002');
      expect(mockedAxios.post).toHaveBeenCalledWith(
        `${env.PAYMENT_API_URL}/transactions`,
        expect.objectContaining({
          shipping_address: undefined,
        }),
        expect.any(Object),
      );
    });

    it('debe lanzar AppError 400 cuando Wompi responde HTTP 422 con errores de validación', async () => {
      mockedAxios.post.mockRejectedValueOnce({
        response: {
          status: 422,
          data: {
            error: {
              messages: {
                installments: ['El número de cuotas no es válido'],
              },
            },
          },
        },
      });

      await expect(adapter.createTransaction(validTxInput)).rejects.toMatchObject({
        statusCode: 400,
        message: expect.stringContaining('Transaction error: {"installments":["El número de cuotas no es válido"]}'),
      });
    });

    it('debe lanzar AppError 500 cuando ocurre un fallo general de red o servidor al crear transacción', async () => {
      mockedAxios.post.mockRejectedValueOnce(new Error('Connection reset by peer'));

      await expect(adapter.createTransaction(validTxInput)).rejects.toMatchObject({
        statusCode: 500,
        message: 'Failed to create transaction with payment provider',
      });
    });
  });

  describe('getTransaction()', () => {
    it('debe mapear y devolver la transacción cuando Wompi responde 200', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          data: {
            id: 'tx_998877',
            status: 'APPROVED',
            reference: 'REF_TEST_001',
            amount_in_cents: 15000000,
            currency: 'COP',
            created_at: '2026-09-01T12:00:00.000Z',
            status_message: 'Transacción aprobada',
          },
        },
      });

      const tx = await adapter.getTransaction('tx_998877');

      expect(tx.id).toBe('tx_998877');
      expect(tx.status).toBe('APPROVED');
      expect(tx.reference).toBe('REF_TEST_001');
      expect(tx.amountInCents).toBe(15000000);
      expect(tx.createdAt).toBe('2026-09-01T12:00:00.000Z');
    });

    it('debe lanzar AppError 404 cuando Wompi responde que la transacción no existe (status 404)', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: {
            error: {
              reason: 'Transacción no encontrada',
            },
          },
        },
      });

      await expect(adapter.getTransaction('non_existent_tx')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Transaction not found',
      });
    });

    it('debe lanzar AppError 500 cuando ocurre un error distinto a 404 al consultar transacción', async () => {
      mockedAxios.get.mockRejectedValueOnce({
        response: {
          status: 503,
          data: { error: 'Service unavailable' },
        },
      });

      await expect(adapter.getTransaction('tx_503')).rejects.toMatchObject({
        statusCode: 500,
        message: 'Failed to fetch transaction from payment provider',
      });
    });
  });
});
