import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ProductCard } from '@/presentation/components/ProductCard';
import checkoutReducer from '@/presentation/redux/slices/checkoutSlice';
import type { Product } from '@/domain/entities/Product';

function renderWithStore(ui: React.ReactElement, initialCheckoutState = {}) {
  const store = configureStore({
    reducer: {
      checkout: checkoutReducer,
    },
    preloadedState: {
      checkout: {
        isOpen: false,
        step: 'CARD_DETAILS',
        product: null,
        deliveryInfo: {} as any,
        cardInfo: {} as any,
        expiryInput: '',
        installments: 1,
        loading: false,
        error: null,
        orderResult: null,
        dataPaymentResult: null,
        ...initialCheckoutState,
      },
    },
  });

  return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

describe('ProductCard Component', () => {
  const mockProduct: Product = {
    id: 'prod-123',
    name: 'Gafas de Sol Premium',
    description: 'Protección UV400 polarizadas',
    priceCents: 15000000, // 150.000 COP
    stock: 5,
    imageUrl: 'http://example.com/gafas.jpg',
    category: 'Accesorios',
  };

  it('debe renderizar el nombre, descripción, categoría y precio en formato COP', () => {
    renderWithStore(<ProductCard product={mockProduct} />);

    expect(screen.getByText('Gafas de Sol Premium')).toBeInTheDocument();
    expect(screen.getByText('Protección UV400 polarizadas')).toBeInTheDocument();
    expect(screen.getByText('Accesorios')).toBeInTheDocument();
    expect(screen.getByText(/150\.000/)).toBeInTheDocument();
    expect(screen.getByText('5 disponibles')).toBeInTheDocument();
  });

  it('debe despachar openCheckout y abrir el modal al hacer clic en el botón de pagar', () => {
    const { store } = renderWithStore(<ProductCard product={mockProduct} />);

    const payButton = screen.getByRole('button', { name: /pagar/i });
    fireEvent.click(payButton);

    const state = store.getState().checkout;
    expect(state.isOpen).toBe(true);
    expect(state.product?.id).toBe('prod-123');
  });

  it('debe deshabilitar el botón y mostrar "Agotado" cuando el producto no tiene stock', () => {
    const outOfStockProduct = { ...mockProduct, stock: 0 };
    renderWithStore(<ProductCard product={outOfStockProduct} />);

    expect(screen.getByText('Agotado')).toBeInTheDocument();
    const button = screen.getByRole('button', { name: /sin stock/i });
    expect(button).toBeDisabled();
  });
});
