import { describe, it, expect, beforeEach } from 'vitest';
import {
  loadCheckoutState,
  saveCheckoutState,
  clearCheckoutState,
  type PersistedCheckoutState,
} from '@/shared/utils/checkoutPersistence';

describe('checkoutPersistence Helper', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleState: PersistedCheckoutState = {
    isOpen: true,
    step: 'CARD_INFO',
    product: { id: 'p1', name: 'Zapatos', priceCents: 15000000 },
    deliveryInfo: { address: 'Calle 10', city: 'Bogotá' },
    cardInfo: { number: '4242 4242 4242 4242', cardHolder: 'Frank' },
    expiryInput: '12/28',
    installments: 1,
    dataPaymentResult: null,
  };

  it('debe retornar undefined cuando no hay estado guardado en localStorage', () => {
    expect(loadCheckoutState()).toBeUndefined();
  });

  it('debe guardar y cargar el estado de checkout fielmente', () => {
    saveCheckoutState(sampleState);
    const loaded = loadCheckoutState();

    expect(loaded).toEqual(sampleState);
  });

  it('debe retornar undefined si el contenido en localStorage no es un JSON válido', () => {
    localStorage.setItem('checkout_state_v1', 'corrupted-json-data');

    expect(loadCheckoutState()).toBeUndefined();
  });

  it('debe limpiar el estado guardado al llamar clearCheckoutState()', () => {
    saveCheckoutState(sampleState);
    expect(loadCheckoutState()).toBeDefined();

    clearCheckoutState();
    expect(loadCheckoutState()).toBeUndefined();
  });
});
