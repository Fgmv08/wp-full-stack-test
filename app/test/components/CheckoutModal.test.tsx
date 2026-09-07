import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { CheckoutModal } from '@/presentation/components/CheckoutModal';
import checkoutReducer from '@/presentation/redux/slices/checkoutSlice';
import type { Product } from '@/domain/entities/Product';

function renderCheckoutModal(isOpen = true, step = 'CARD_DETAILS') {
  const sampleProduct: Product = {
    id: 'prod-uuid-1',
    name: 'Teclado Mecánico RGB',
    description: 'Teclado con switches mecánicos',
    priceCents: 20000000, // 200.000 COP
    stock: 5,
    imageUrl: 'http://example.com/teclado.png',
    category: 'Tecnología',
  };

  const store = configureStore({
    reducer: {
      checkout: checkoutReducer,
    },
    preloadedState: {
      checkout: {
        isOpen,
        step: step as any,
        product: sampleProduct,
        deliveryInfo: {
          recipientName: 'Carlos Mendoza',
          recipientPhone: '3001234567',
          address: 'Calle 100 # 15-20',
          city: 'Bogotá',
          department: 'Cundinamarca',
          postalCode: '110111',
        },
        cardInfo: {
          number: '4242 4242 4242 4242',
          cvc: '123',
          expMonth: '12',
          expYear: '28',
          cardHolder: 'CARLOS MENDOZA',
          brand: 'VISA',
        },
        expiryInput: '12/28',
        installments: 1,
        loading: false,
        error: null,
        orderResult: null,
        dataPaymentResult: null,
      },
    },
  });

  return { ...render(<Provider store={store}><CheckoutModal /></Provider>), store };
}

describe('CheckoutModal Component', () => {
  it('no debe renderizar nada si isOpen es false', () => {
    const { container } = renderCheckoutModal(false);
    expect(container).toBeEmptyDOMElement();
  });

  it('debe renderizar el paso 1 (Datos de Tarjeta) con los campos de entrada requeridos', () => {
    renderCheckoutModal(true, 'CARD_DETAILS');

    expect(screen.getByText('1. Información de pago')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/carlos mendoza/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText('123')).toBeInTheDocument();
  });

  it('debe cerrar el modal al hacer clic en el botón de cerrar (x)', () => {
    const { store } = renderCheckoutModal(true, 'CARD_DETAILS');

    // Botón de cerrar modal en el header
    const closeButtons = screen.getAllByRole('button');
    const headerCloseBtn = closeButtons[0];
    fireEvent.click(headerCloseBtn);

    expect(store.getState().checkout.isOpen).toBe(false);
  });

  it('debe permitir avanzar a Información de Entrega si la tarjeta es válida', async () => {
    const { store } = renderCheckoutModal(true, 'CARD_DETAILS');

    const continueButton = screen.getByRole('button', { name: /siguiente: datos de entrega/i });
    fireEvent.click(continueButton);

    // Debe avanzar al paso DELIVERY_INFO
    expect(store.getState().checkout.step).toBe('DELIVERY_INFO');
  });

  it('debe renderizar los campos de envío en el paso DELIVERY_INFO', () => {
    renderCheckoutModal(true, 'DELIVERY_INFO');

    expect(screen.getByText('2. Información de envío')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Calle 100 # 15-20')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Carlos Mendoza')).toBeInTheDocument();
  });
});
