import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { OrdersSummaryModal } from '@/presentation/components/OrdersSummaryModal';
import orderReducer from '@/presentation/redux/slices/orderSlice';
import type { Order } from '@/domain/entities/Order';

const { mockGetOrders } = vi.hoisted(() => ({
  mockGetOrders: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/infrastructure/api/HttpPaymentRepository', () => {
  return {
    HttpPaymentRepository: class {
      getOrders = mockGetOrders;
    },
  };
});

function renderModal(isOrdersModalOpen = true, orders: Order[] = [], loading = false) {
  const store = configureStore({
    reducer: {
      order: orderReducer,
    },
    preloadedState: {
      order: {
        orders,
        loading,
        error: null,
        isOrdersModalOpen,
      },
    },
  });

  return { ...render(<Provider store={store}><OrdersSummaryModal /></Provider>), store };
}

describe('OrdersSummaryModal Component', () => {
  const sampleOrder: Order = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    userId: 'user-1',
    productIds: ['prod-1'],
    totalAmountCents: 16300000,
    baseFeeCents: 500000,
    shippingFeeCents: 800000,
    status: 'APPROVED',
    deliveryInfo: {
      address: 'Calle 100 # 15-20',
      city: 'Bogotá',
      department: 'Cundinamarca',
      postalCode: '110111',
      recipientName: 'Carlos Mendoza',
      recipientPhone: '3001234567',
    },
    reference: 'REF_TEST_101',
    wompiTransactionId: 'tx-wompi-888',
    cardInfo: {
      brand: 'VISA',
      lastFour: '4242',
      cardHolder: 'Carlos Mendoza',
    },
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: '2026-09-01T10:05:00.000Z',
  };

  it('no debe renderizar nada cuando isOrdersModalOpen es false', () => {
    const { container } = renderModal(false, []);
    expect(container).toBeEmptyDOMElement();
  });

  it('debe mostrar mensaje de "Aún no hay pedidos" cuando la lista está vacía', async () => {
    mockGetOrders.mockResolvedValueOnce([]);
    renderModal(true, []);

    expect(screen.getByText('Pedidos en el Sistema')).toBeInTheDocument();
    expect(await screen.findByText(/aún no hay pedidos registrados/i)).toBeInTheDocument();
  });

  it('debe listar los pedidos, referencia, total en COP y tarjeta enmascarada', async () => {
    mockGetOrders.mockResolvedValueOnce([sampleOrder]);
    renderModal(true, [sampleOrder]);

    expect(screen.getByText('Pedidos en el Sistema')).toBeInTheDocument();
    expect(await screen.findByText(/REF_TEST_101/i)).toBeInTheDocument();
    expect(screen.getByText('APPROVED')).toBeInTheDocument();
    expect(screen.getByText(/163\.000/)).toBeInTheDocument();
    expect(screen.getByText(/VISA/i)).toBeInTheDocument();
    expect(screen.getByText(/4242/)).toBeInTheDocument();
  });

  it('debe cerrar el modal al hacer clic en el botón de cerrar', () => {
    mockGetOrders.mockResolvedValueOnce([]);
    const { store } = renderModal(true, [sampleOrder]);

    const closeButton = screen.getByRole('button', { name: /^cerrar$/i });
    fireEvent.click(closeButton);

    expect(store.getState().order.isOrdersModalOpen).toBe(false);
  });
});
