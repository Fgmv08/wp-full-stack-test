import { describe, it, expect } from 'vitest';
import checkoutReducer, {
  openCheckout,
  closeCheckout,
  setStep,
  updateDeliveryInfo,
  updateCardInfo,
  setExpiryInput,
  setInstallments,
  resetCheckout,
} from '@/presentation/redux/slices/checkoutSlice';
import type { Product } from '@/domain/entities/Product';

describe('checkoutSlice Reducer', () => {
  const sampleProduct: Product = {
    id: 'prod-001',
    name: 'Silla Ergonómica',
    description: 'Silla para oficina',
    priceCents: 45000000,
    stock: 5,
    imageUrl: 'http://img.com/silla.png',
    category: 'Muebles',
  };

  it('debe abrir checkout y configurar el producto en step CARD_DETAILS', () => {
    const nextState = checkoutReducer(undefined, openCheckout(sampleProduct));

    expect(nextState.isOpen).toBe(true);
    expect(nextState.product).toEqual(sampleProduct);
    expect(nextState.step).toBe('CARD_DETAILS');
  });

  it('debe cerrar checkout con closeCheckout', () => {
    const openedState = checkoutReducer(undefined, openCheckout(sampleProduct));
    const closedState = checkoutReducer(openedState, closeCheckout());

    expect(closedState.isOpen).toBe(false);
  });

  it('debe permitir cambiar de paso con setStep', () => {
    const nextState = checkoutReducer(undefined, setStep('PROCESSING'));
    expect(nextState.step).toBe('PROCESSING');
  });

  it('debe actualizar información de entrega parcialmente con updateDeliveryInfo', () => {
    const nextState = checkoutReducer(
      undefined,
      updateDeliveryInfo({ city: 'Medellín', address: 'Cra 43A # 1-50' })
    );

    expect(nextState.deliveryInfo.city).toBe('Medellín');
    expect(nextState.deliveryInfo.address).toBe('Cra 43A # 1-50');
    expect(nextState.deliveryInfo.recipientName).toBeDefined(); // mantiene otros campos por defecto
  });

  it('debe actualizar información de tarjeta con updateCardInfo', () => {
    const nextState = checkoutReducer(
      undefined,
      updateCardInfo({ number: '4242 4242 4242 4242', brand: 'VISA' })
    );

    expect(nextState.cardInfo.number).toBe('4242 4242 4242 4242');
    expect(nextState.cardInfo.brand).toBe('VISA');
  });

  it('debe sincronizar expMonth y expYear automáticamente al cambiar setExpiryInput', () => {
    const nextState = checkoutReducer(undefined, setExpiryInput('11/29'));

    expect(nextState.expiryInput).toBe('11/29');
    expect(nextState.cardInfo.expMonth).toBe('11');
    expect(nextState.cardInfo.expYear).toBe('29');
  });

  it('debe actualizar número de cuotas con setInstallments', () => {
    const nextState = checkoutReducer(undefined, setInstallments(6));
    expect(nextState.installments).toBe(6);
  });

  it('debe restablecer el estado inicial con resetCheckout', () => {
    const modified = checkoutReducer(undefined, openCheckout(sampleProduct));
    const reset = checkoutReducer(modified, resetCheckout());

    expect(reset.isOpen).toBe(false);
    expect(reset.product).toBeNull();
  });
});
