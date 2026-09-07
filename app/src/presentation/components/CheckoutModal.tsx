import React, { useState, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import {
  closeCheckout,
  setStep,
  updateDeliveryInfo,
  updateCardInfo,
  setExpiryInput,
  requestDataPayment,
} from '../redux/slices/checkoutSlice';
import {
  validateLuhn,
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  validateExpiry,
  type CardBrand,
} from '@/shared/utils/cardUtils';
import { COLOMBIA_DEPARTMENTS } from '@/shared/data/colombiaData';
import { SearchableSelect } from './SearchableSelect';
import { WompiWidgetButton } from './WompiWidgetButton';

export const CheckoutModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    isOpen,
    step,
    product,
    deliveryInfo,
    cardInfo,
    expiryInput,
    loading,
    error,
    dataPaymentResult,
  } = useAppSelector((state) => state.checkout);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Departments list
  const departmentsList = useMemo(
    () => COLOMBIA_DEPARTMENTS.map((d) => d.department),
    []
  );

  // Cities for selected department
  const citiesList = useMemo(() => {
    const found = COLOMBIA_DEPARTMENTS.find(
      (d) => d.department.toLowerCase() === (deliveryInfo.department || '').toLowerCase()
    );
    return found ? found.cities : [];
  }, [deliveryInfo.department]);

  // Detected brand
  const cardBrand: CardBrand = useMemo(() => {
    return detectCardBrand(cardInfo.number);
  }, [cardInfo.number]);

  if (!isOpen || !product) return null;

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(product.priceCents / 100);

  const validateCard = (): boolean => {
    const errors: Record<string, string> = {};
    const cleanNum = cardInfo.number.replace(/\s+/g, '');

    if (!cleanNum || cleanNum.length < 13 || cleanNum.length > 19) {
      errors.number = 'Número de tarjeta inválido (13 a 19 dígitos)';
    } else if (!validateLuhn(cleanNum)) {
      errors.number = 'Número de tarjeta inválido';
    }

    if (!cardInfo.cardHolder || cardInfo.cardHolder.trim().length < 3) {
      errors.cardHolder = 'Nombre del titular requerido';
    }

    if (!expiryInput || !validateExpiry(expiryInput)) {
      errors.expiry = 'Fecha de expiración inválida (Formato MM/YY)';
    }

    if (!cardInfo.cvc || cardInfo.cvc.length < 3 || cardInfo.cvc.length > 4) {
      errors.cvc = 'CVC de 3 o 4 dígitos';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ── Step 2 Validation (Delivery Details) ───────────────────────
  const validateDelivery = (): boolean => {
    const errors: Record<string, string> = {};

    if (!deliveryInfo.recipientName || deliveryInfo.recipientName.trim().length < 3) {
      errors.recipientName = 'Nombre completo requerido';
    }
    if (!deliveryInfo.recipientPhone || deliveryInfo.recipientPhone.replace(/\D/g, '').length < 7) {
      errors.recipientPhone = 'Teléfono de contacto requerido';
    }
    if (!deliveryInfo.address || deliveryInfo.address.trim().length < 5) {
      errors.address = 'Dirección completa requerida';
    }
    if (!deliveryInfo.department) {
      errors.department = 'Selecciona un departamento';
    }
    if (!deliveryInfo.city) {
      errors.city = 'Selecciona una ciudad';
    }
    if (!deliveryInfo.postalCode || deliveryInfo.postalCode.trim().length < 4) {
      errors.postalCode = 'Código postal requerido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCardNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateCard()) {
      dispatch(updateCardInfo({ brand: cardBrand }));
      dispatch(setStep('DELIVERY_INFO'));
      setFormErrors({});
    }
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateDelivery()) {
      const actionResult = await dispatch(requestDataPayment());
      if (requestDataPayment.fulfilled.match(actionResult)) {
        dispatch(setStep('CONFIRMATION'));
      }
    }
  };

  // ! Simplemente para fácilitar la prueba del pago sandbox, 
  const fillTestCard = (type: 'APPROVED' | 'DECLINED') => {
    if (type === 'APPROVED') {
      const formatted = formatCardNumber('4242424242424242');
      dispatch(
        updateCardInfo({
          number: formatted,
          cvc: '123',
          cardHolder: 'CARLOS MENDOZA',
          brand: 'VISA',
        })
      );
      dispatch(setExpiryInput('12/30'));
    } else {
      const formatted = formatCardNumber('4111111111111111');
      dispatch(
        updateCardInfo({
          number: formatted,
          cvc: '123',
          cardHolder: 'MARIA GOMEZ',
          brand: 'MASTERCARD',
        })
      );
      dispatch(setExpiryInput('12/30'));
    }
    setFormErrors({});
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl sm:max-w-2xl max-h-[92vh] flex flex-col glass-modal rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden my-auto">
        {/* ── Modal Header: Title & Close Button (Separated to avoid overlap) ── */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-900/60 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30 flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                {step === 'CARD_DETAILS'
                  ? '1. Información de pago'
                  : step === 'DELIVERY_INFO'
                    ? '2. Información de envío'
                    : '3. Resumen y Pago'}
              </h3>
              <p className="text-xs text-slate-400">Onboarding de pago seguro shop store (Sandbox)</p>
            </div>
          </div>

          {/* Close button with clear padding, never overlapping */}
          <button
            type="button"
            onClick={() => dispatch(closeCheckout())}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ── Steps Progress Indicator ── */}
        <div className="px-4 sm:px-6 py-3 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'CARD_DETAILS'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/50'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
            >
              {step !== 'CARD_DETAILS' ? '✓' : '1'}
            </span>
            <span className="text-xs font-semibold text-slate-300">Información de pago</span>
          </div>

          <div className="w-8 sm:w-16 h-0.5 bg-slate-800"></div>

          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'DELIVERY_INFO'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/50'
                  : step === 'CONFIRMATION'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500'
                }`}
            >
              {step === 'CONFIRMATION' ? '✓' : '2'}
            </span>
            <span className="text-xs font-semibold text-slate-300">Datos de Envío</span>
          </div>

          <div className="w-8 sm:w-16 h-0.5 bg-slate-800"></div>

          <div className="flex items-center space-x-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'CONFIRMATION'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/50'
                  : 'bg-slate-800 text-slate-500'
                }`}
            >
              3
            </span>
            <span className="text-xs font-semibold text-slate-300">Pagar con Wompi</span>
          </div>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="p-4 sm:p-7 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
          {/* Product Summary Banner */}
          <div className="flex items-center space-x-3.5 p-3 sm:p-4 rounded-2xl bg-slate-900/80 border border-slate-800">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-14 h-14 rounded-xl object-cover bg-slate-950 flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-xs sm:text-sm text-slate-100 truncate">{product.name}</h4>
              <p className="text-[11px] text-slate-400">{product.stock} unidad{product.stock === 1 ? '' : 'es'} disponible{product.stock === 1 ? '' : 's'}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Precio</span>
              <span className="text-base sm:text-lg font-black text-indigo-400">{formattedPrice}</span>
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start space-x-2.5">
              <svg className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 1: TARJETA DE CRÉDITO (Visa / Mastercard / Luhn / MM/YY)
             ═══════════════════════════════════════════════════════════════ */}
          {step === 'CARD_DETAILS' && (
            <form onSubmit={handleCardNext} className="space-y-4">
              {/* Quick Fill Test Cards */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
                <span className="text-slate-400 font-medium">Shema Visa (Pruebas Sandbox):</span>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    title='Para aprobar el pago en la prueba'
                    onClick={() => fillTestCard('APPROVED')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition font-semibold"
                  >
                    ⚡ Visa Aprobada
                  </button>
                  <button
                    type="button"
                    title='Para rechazar el pago en la prueba'
                    onClick={() => fillTestCard('DECLINED')}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition font-semibold"
                  >
                    ⚡ Visa Rechazada
                  </button>
                </div>
              </div>

              {/* Card Number Input with Brand Logo Detection */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300">Número de Tarjeta de Crédito</label>
                  {/* Brand Badge */}
                  <div className="flex items-center space-x-1.5">
                    {cardBrand === 'VISA' && (
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-sky-400 bg-sky-950/80 px-2 py-0.5 rounded border border-sky-800">
                        <svg className="w-5 h-3" viewBox="0 0 36 12" fill="currentColor">
                          <path d="M14.5 1.5L12 11.5H9.5L12 1.5H14.5ZM24.5 1.8C24 1.6 23.2 1.4 22.2 1.4C19.7 1.4 17.9 2.7 17.9 4.6C17.9 6 19.2 6.8 20.2 7.3C21.2 7.8 21.6 8.1 21.6 8.6C21.6 9.3 20.7 9.7 19.8 9.7C18.6 9.7 17.9 9.5 17.1 9.1L16.7 8.9L16.3 11.3C17 11.6 18.3 11.9 19.6 11.9C22.3 11.9 24.1 10.6 24.1 8.5C24.1 7.2 23.2 6.2 21.7 5.5C20.8 5 20.3 4.7 20.3 4.2C20.3 3.7 20.9 3.2 22 3.2C22.9 3.2 23.6 3.4 24.1 3.6L24.5 1.8ZM31.4 1.5H29.5C28.8 1.5 28.3 1.7 28 2.3L23.9 11.5H26.5L27 10H30.1L30.4 11.5H32.7L31.4 1.5ZM27.8 8L29 4.6L29.7 8H27.8ZM7.5 1.5L5.1 8.3L4.8 6.9C4.3 5.3 3 3.6 1.4 2.8L3.6 11.5H6.2L10.1 1.5H7.5Z" />
                        </svg>
                        <span>VISA</span>
                      </span>
                    )}

                    {cardBrand === 'MASTERCARD' && (
                      <span className="flex items-center space-x-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block -mr-1 opacity-90"></span>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block opacity-90"></span>
                        <span>MASTERCARD</span>
                      </span>
                    )}

                    {cardBrand === 'UNKNOWN' && cardInfo.number.length > 0 && (
                      <span className="text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                        Tarjeta
                      </span>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  maxLength={23}
                  value={cardInfo.number}
                  onChange={(e) => {
                    const formatted = formatCardNumber(e.target.value);
                    dispatch(updateCardInfo({ number: formatted }));
                    if (formErrors.number) setFormErrors({ ...formErrors, number: '' });
                  }}
                  placeholder="4242  4242  4242  4242"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition tracking-widest font-mono ${formErrors.number
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-800 focus:border-indigo-500'
                    }`}
                />
                {formErrors.number && <p className="text-xs text-rose-400 mt-1">{formErrors.number}</p>}
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre del Titular</label>
                <input
                  type="text"
                  value={cardInfo.cardHolder}
                  onChange={(e) => {
                    dispatch(updateCardInfo({ cardHolder: e.target.value.toUpperCase() }));
                    if (formErrors.cardHolder) setFormErrors({ ...formErrors, cardHolder: '' });
                  }}
                  placeholder="CARLOS MENDOZA"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition uppercase tracking-wide ${formErrors.cardHolder
                      ? 'border-rose-500 focus:border-rose-400'
                      : 'border-slate-800 focus:border-indigo-500'
                    }`}
                />
                {formErrors.cardHolder && <p className="text-xs text-rose-400 mt-1">{formErrors.cardHolder}</p>}
              </div>

              {/* Combined Expiry MM/YY and CVC (Sin selector de cuotas, por defecto débito 1 pago) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Single Combined Expiry Input MM/YY */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Vencimiento (MM/YY)
                  </label>
                  <input
                    type="text"
                    maxLength={5}
                    value={expiryInput}
                    onChange={(e) => {
                      const formatted = formatExpiry(e.target.value);
                      dispatch(setExpiryInput(formatted));
                      if (formErrors.expiry) setFormErrors({ ...formErrors, expiry: '' });
                    }}
                    placeholder="12/28"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition text-center font-mono tracking-wider ${formErrors.expiry
                        ? 'border-rose-500 focus:border-rose-400'
                        : 'border-slate-800 focus:border-indigo-500'
                      }`}
                  />
                  {formErrors.expiry && <p className="text-xs text-rose-400 mt-1">{formErrors.expiry}</p>}
                </div>

                {/* CVC / CVV */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">CVC / CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardInfo.cvc}
                    onChange={(e) => {
                      dispatch(updateCardInfo({ cvc: e.target.value.replace(/\D/g, '') }));
                      if (formErrors.cvc) setFormErrors({ ...formErrors, cvc: '' });
                    }}
                    placeholder="123"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition text-center font-mono ${formErrors.cvc
                        ? 'border-rose-500 focus:border-rose-400'
                        : 'border-slate-800 focus:border-indigo-500'
                      }`}
                  />
                  {formErrors.cvc && <p className="text-xs text-rose-400 mt-1">{formErrors.cvc}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-2.5 p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-xs text-slate-400">Información Asegurada</span>
              </div>

              {/* Actions */}
              <div className="pt-3 flex justify-end">
                <button
                  type="submit"
                  className="gradient-button w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center space-x-2"
                >
                  <span>Siguiente: Datos de Entrega</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 2: DATOS DE ENVÍO & CLIENTE (Pre-filled + Searchable selects)
             ═══════════════════════════════════════════════════════════════ */}
          {step === 'DELIVERY_INFO' && (
            <form onSubmit={handleDeliverySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nombre Completo</label>
                  <input
                    type="text"
                    value={deliveryInfo.recipientName}
                    onChange={(e) => {
                      dispatch(updateDeliveryInfo({ recipientName: e.target.value }));
                      if (formErrors.recipientName) setFormErrors({ ...formErrors, recipientName: '' });
                    }}
                    placeholder="Carlos Mendoza"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition ${formErrors.recipientName ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                      }`}
                  />
                  {formErrors.recipientName && <p className="text-xs text-rose-400 mt-1">{formErrors.recipientName}</p>}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={deliveryInfo.recipientPhone}
                    onChange={(e) => {
                      dispatch(updateDeliveryInfo({ recipientPhone: e.target.value }));
                      if (formErrors.recipientPhone) setFormErrors({ ...formErrors, recipientPhone: '' });
                    }}
                    placeholder="3001234567"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition ${formErrors.recipientPhone ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                      }`}
                  />
                  {formErrors.recipientPhone && <p className="text-xs text-rose-400 mt-1">{formErrors.recipientPhone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Dirección de Entrega</label>
                <input
                  type="text"
                  value={deliveryInfo.address}
                  onChange={(e) => {
                    dispatch(updateDeliveryInfo({ address: e.target.value }));
                    if (formErrors.address) setFormErrors({ ...formErrors, address: '' });
                  }}
                  placeholder="Calle 100 # 15-20 Apt 501"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition ${formErrors.address ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                    }`}
                />
                {formErrors.address && <p className="text-xs text-rose-400 mt-1">{formErrors.address}</p>}
              </div>

              {/* Searchable Dropdowns for Departamento & Ciudad */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Departamento Searchable Select */}
                <div>
                  <SearchableSelect
                    label="Departamento"
                    value={deliveryInfo.department}
                    options={departmentsList}
                    placeholder="Buscar departamento..."
                    error={formErrors.department}
                    onChange={(dept) => {
                      dispatch(updateDeliveryInfo({ department: dept, city: '' }));
                      if (formErrors.department) setFormErrors({ ...formErrors, department: '' });
                    }}
                  />
                </div>

                {/* Ciudad Searchable Select (filtered by department) */}
                <div>
                  <SearchableSelect
                    label="Ciudad"
                    value={deliveryInfo.city}
                    options={citiesList}
                    placeholder={
                      deliveryInfo.department
                        ? 'Buscar ciudad...'
                        : 'Elige departamento primero'
                    }
                    disabled={!deliveryInfo.department}
                    error={formErrors.city}
                    onChange={(cityName) => {
                      dispatch(updateDeliveryInfo({ city: cityName }));
                      if (formErrors.city) setFormErrors({ ...formErrors, city: '' });
                    }}
                  />
                </div>

                {/* Código Postal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Código Postal</label>
                  <input
                    type="text"
                    value={deliveryInfo.postalCode}
                    onChange={(e) => {
                      dispatch(updateDeliveryInfo({ postalCode: e.target.value }));
                      if (formErrors.postalCode) setFormErrors({ ...formErrors, postalCode: '' });
                    }}
                    placeholder="110111"
                    className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition ${formErrors.postalCode ? 'border-rose-500' : 'border-slate-800 focus:border-indigo-500'
                      }`}
                  />
                  {formErrors.postalCode && <p className="text-xs text-rose-400 mt-1">{formErrors.postalCode}</p>}
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => dispatch(setStep('CARD_DETAILS'))}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                >
                  ← Volver a Tarjeta
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="gradient-button w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm text-white shadow-lg flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white animate-spin"></div>
                      <span>Generando firma Wompi...</span>
                    </>
                  ) : (
                    <>
                      <span>Revisar Resumen y Pagar</span>
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ═══════════════════════════════════════════════════════════════
              STEP 3: RESUMEN DE TRANSACCIÓN Y BOTÓN OFICIAL WOMPI
             ═══════════════════════════════════════════════════════════════ */}
          {step === 'CONFIRMATION' && dataPaymentResult && (
            <div className="space-y-5">
              {/* Cost breakdown summary */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-200">Resumen de la Transacción</span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-semibold">
                    Tarifa Oficial
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tarifa base producto:</span>
                    <span>{formattedPrice}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Costo de entrega:</span>
                    <span>$ 8.000 COP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tarifa base administrativa:</span>
                    <span>$ 5.000 COP</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-slate-800 font-bold text-sm text-white">
                    <span>Total a Pagar:</span>
                    <span className="text-indigo-400">
                      {new Intl.NumberFormat('es-CO', {
                        style: 'currency',
                        currency: 'COP',
                        maximumFractionDigits: 0,
                      }).format(dataPaymentResult.amountInCents / 100)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Delivery & Payment details summary */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <span className="font-bold text-slate-300 block">Datos de Entrega</span>
                  <p className="text-slate-400 truncate">
                    {deliveryInfo.recipientName} ({deliveryInfo.recipientPhone})
                  </p>
                  <p className="text-slate-400 truncate">
                    {deliveryInfo.address}, {deliveryInfo.city} - {deliveryInfo.department}
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 space-y-1">
                  <span className="font-bold text-slate-300 block">Método de Pago</span>
                  <p className="text-slate-400 flex items-center space-x-1">
                    <span>Tarjeta:</span>
                    <span className="font-mono text-white">
                      •••• {cardInfo.number.replace(/\s+/g, '').slice(-4) || '4242'}
                    </span>
                  </p>
                  <p className="text-slate-400 truncate">Titular: {cardInfo.cardHolder}</p>
                </div>
              </div>

              {/* Integrity and Reference Info */}
              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/20 text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-indigo-300 font-semibold">Referencia de Pago:</span>
                  <span className="font-mono font-bold text-white text-[11px]">{dataPaymentResult.reference}</span>
                </div>
              </div>

              {/* Official Wompi Widget Button rendered dynamically */}
              <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col items-center justify-center space-y-3">
                <span className="text-xs text-slate-300 font-semibold">
                  Haz clic para abrir la pasarela
                </span>
                <WompiWidgetButton
                  publicKey={dataPaymentResult.publicKey}
                  currency={dataPaymentResult.currency}
                  amountInCents={dataPaymentResult.amountInCents}
                  reference={dataPaymentResult.reference}
                  signatureIntegrity={dataPaymentResult.signature.integrity}
                  redirectUrl={dataPaymentResult.redirectUrl}
                  customerData={dataPaymentResult.customerData}
                  shippingAddress={dataPaymentResult.shippingAddress}
                />
              </div>

              {/* Back to Delivery Details button */}
              <div className="pt-2 flex justify-start">
                <button
                  type="button"
                  onClick={() => dispatch(setStep('DELIVERY_INFO'))}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  ← Volver a Datos de Envío
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
