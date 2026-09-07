import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { Header } from '@/presentation/components/Header';
import orderReducer, { fetchOrders } from '@/presentation/redux/slices/orderSlice';

vi.mock('@/infrastructure/api/HttpPaymentRepository', () => {
  return {
    HttpPaymentRepository: class {
      getOrders = vi.fn().mockResolvedValue([]);
    },
  };
});

function renderHeader(ordersCount = 3) {
  const store = configureStore({
    reducer: {
      order: orderReducer,
    },
    preloadedState: {
      order: {
        orders: Array(ordersCount).fill({ id: 'ord-1' }) as any,
        loading: false,
        error: null,
        isOrdersModalOpen: false,
      },
    },
  });

  return { ...render(<Provider store={store}><Header /></Provider>), store };
}

describe('Header Component', () => {
  it('debe renderizar el título de la tienda, el contador de pedidos y el saludo de usuario', () => {
    renderHeader(2);

    expect(screen.getByText('Shop Store')).toBeInTheDocument();
    expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // Badge de pedidos
    expect(screen.getByText('Hola,')).toBeInTheDocument();
    expect(screen.getByText('Frank')).toBeInTheDocument();
    expect(screen.getByText('F')).toBeInTheDocument(); // Letra inicial
  });

  it('debe despachar openOrdersModal al hacer clic en Mis Pedidos', () => {
    const { store } = renderHeader(1);

    const ordersBtn = screen.getByRole('button', { name: /mis pedidos/i });
    fireEvent.click(ordersBtn);

    expect(store.getState().order.isOrdersModalOpen).toBe(true);
  });
});
