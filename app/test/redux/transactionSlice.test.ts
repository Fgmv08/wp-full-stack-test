import { describe, it, expect } from 'vitest';
import transactionReducer, {
  clearTransaction,
  fetchTransactionStatus,
  confirmPaymentStatus,
} from '@/presentation/redux/slices/transactionSlice';
import type { TransactionResult } from '@/domain/ports/IPaymentRepository';

describe('transactionSlice Reducer', () => {
  const sampleTx: TransactionResult = {
    id: 'tx-12345',
    status: 'APPROVED',
    reference: 'REF-001',
    amountInCents: 15000000,
    currency: 'COP',
    createdAt: new Date().toISOString(),
  };

  it('debe limpiar transacción con clearTransaction', () => {
    const activeState = {
      transaction: sampleTx,
      loading: false,
      error: 'Algún error',
    };

    const nextState = transactionReducer(activeState, clearTransaction());
    expect(nextState.transaction).toBeNull();
    expect(nextState.error).toBeNull();
  });

  describe('fetchTransactionStatus extraReducers', () => {
    it('debe setear loading a true en pending', () => {
      const state = transactionReducer(undefined, { type: fetchTransactionStatus.pending.type });
      expect(state.loading).toBe(true);
    });

    it('debe guardar la transacción y setear loading a false en fulfilled', () => {
      const state = transactionReducer(undefined, {
        type: fetchTransactionStatus.fulfilled.type,
        payload: sampleTx,
      });

      expect(state.loading).toBe(false);
      expect(state.transaction).toEqual(sampleTx);
    });

    it('debe guardar error en rejected', () => {
      const state = transactionReducer(undefined, {
        type: fetchTransactionStatus.rejected.type,
        payload: 'Transacción no encontrada',
      });

      expect(state.loading).toBe(false);
      expect(state.error).toBe('Transacción no encontrada');
    });
  });

  describe('confirmPaymentStatus extraReducers', () => {
    it('debe actualizar transacción en fulfilled', () => {
      const state = transactionReducer(undefined, {
        type: confirmPaymentStatus.fulfilled.type,
        payload: sampleTx,
      });

      expect(state.loading).toBe(false);
      expect(state.transaction).toEqual(sampleTx);
    });
  });
});
