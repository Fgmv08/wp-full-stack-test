import { describe, it, expect } from 'vitest';
import orderReducer, {
  openOrdersModal,
  closeOrdersModal,
  fetchOrders,
} from '@/presentation/redux/slices/orderSlice';
import type { Order } from '@/domain/entities/Order';

describe('orderSlice Reducer', () => {
  const sampleOrder: Order = {
    id: 'ord-1',
    userId: 'usr-1',
    productIds: ['prod-1'],
    totalAmountCents: 15000000,
    baseFeeCents: 500000,
    shippingFeeCents: 800000,
    status: 'APPROVED',
    deliveryInfo: {
      address: 'Calle 1',
      city: 'Bogotá',
      department: 'Cundinamarca',
      postalCode: '110111',
      recipientName: 'Carlos',
      recipientPhone: '3001234567',
    },
    reference: 'REF-1',
    wompiTransactionId: 'tx-1',
    cardInfo: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const initialState = {
    orders: [],
    loading: false,
    error: null,
    isOrdersModalOpen: false,
  };

  it('debe manejar el estado inicial por defecto', () => {
    expect(orderReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('debe abrir y cerrar el modal con openOrdersModal y closeOrdersModal', () => {
    let state = orderReducer(initialState, openOrdersModal());
    expect(state.isOrdersModalOpen).toBe(true);

    state = orderReducer(state, closeOrdersModal());
    expect(state.isOrdersModalOpen).toBe(false);
  });

  describe('fetchOrders extraReducers', () => {
    it('debe cambiar loading a true en pending', () => {
      const state = orderReducer(initialState, { type: fetchOrders.pending.type });
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('debe guardar órdenes y poner loading en false en fulfilled', () => {
      const state = orderReducer(
        { ...initialState, loading: true },
        { type: fetchOrders.fulfilled.type, payload: [sampleOrder] }
      );
      expect(state.loading).toBe(false);
      expect(state.orders).toEqual([sampleOrder]);
    });

    it('debe registrar error en rejected', () => {
      const state = orderReducer(
        { ...initialState, loading: true },
        { type: fetchOrders.rejected.type, payload: 'Error de red' }
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error de red');
    });
  });
});
