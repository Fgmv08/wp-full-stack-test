import React, { useState } from 'react'
import { useAppDispatch, useAppSelector } from '../redux/store'
import {
  closeCheckout,
  setStep,
  updateDeliveryInfo,
  updateCardInfo,
  setInstallments,
  processPayment,
  resetCheckout,
} from '../redux/slices/checkoutSlice'

export const CheckoutModal: React.FC = () => {
  const dispatch = useAppDispatch()
  const { isOpen, step, product, deliveryInfo, cardInfo, installments, loading, error, orderResult } =
    useAppSelector((state) => state.checkout)

  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  if (!isOpen || !product) return null

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(product.priceCents / 100)

  // Validation logic
  const validateDelivery = () => {
    const errors: Record<string, string> = {}
    if (!deliveryInfo.recipientName || deliveryInfo.recipientName.length < 3) {
      errors.recipientName = 'Nombre completo requerido (mín. 3 letras)'
    }
    if (!deliveryInfo.recipientPhone || deliveryInfo.recipientPhone.length < 7) {
      errors.recipientPhone = 'Teléfono válido requerido'
    }
    if (!deliveryInfo.address || deliveryInfo.address.length < 5) {
      errors.address = 'Dirección completa requerida'
    }
    if (!deliveryInfo.city) errors.city = 'Ciudad requerida'
    if (!deliveryInfo.department) errors.department = 'Departamento requerido'
    if (!deliveryInfo.postalCode) errors.postalCode = 'Código postal requerido'

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const validateCard = () => {
    const errors: Record<string, string> = {}
    const cleanNum = cardInfo.number.replace(/\s+/g, '')
    if (!cleanNum || cleanNum.length < 13 || cleanNum.length > 19) {
      errors.number = 'Número de tarjeta inválido (13-19 dígitos)'
    }
    if (!cardInfo.cvc || cardInfo.cvc.length < 3) {
      errors.cvc = 'CVC de 3 o 4 dígitos'
    }
    if (!cardInfo.expMonth || cardInfo.expMonth.length !== 2) {
      errors.expMonth = 'Mes en formato MM'
    }
    if (!cardInfo.expYear || cardInfo.expYear.length !== 2) {
      errors.expYear = 'Año en formato YY'
    }
    if (!cardInfo.cardHolder || cardInfo.cardHolder.length < 3) {
      errors.cardHolder = 'Nombre del titular de la tarjeta requerido'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNextStep = () => {
    if (step === 'DELIVERY_INFO') {
      if (validateDelivery()) {
        dispatch(setStep('CARD_DETAILS'))
      }
    }
  }

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateCard()) {
      dispatch(processPayment())
    }
  }

  const fillTestCard = (type: 'APPROVED' | 'DECLINED') => {
    if (type === 'APPROVED') {
      dispatch(
        updateCardInfo({
          number: '4242424242424242',
          cvc: '123',
          expMonth: '12',
          expYear: '30',
          cardHolder: 'JUAN PEREZ (APROBADO)',
        })
      )
    } else {
      dispatch(
        updateCardInfo({
          number: '4000000000000002',
          cvc: '123',
          expMonth: '12',
          expYear: '30',
          cardHolder: 'MARIA LOPEZ (RECHAZADO)',
        })
      )
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-modal w-full max-w-2xl rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-700/60 relative my-8">
        {/* Close Button */}
        <button
          onClick={() => dispatch(closeCheckout())}
          disabled={loading}
          className="absolute top-6 right-6 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Steps indicator */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 'DELIVERY_INFO'
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
              }`}
            >
              1
            </span>
            <span className="text-sm font-semibold text-slate-300">Entrega</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-800"></div>

          <div className="flex items-center space-x-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 'CARD_DETAILS'
                  ? 'bg-indigo-500 text-white'
                  : step === 'CONFIRMATION' || step === 'PROCESSING'
                  ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              2
            </span>
            <span className="text-sm font-semibold text-slate-300">Pago Wompi</span>
          </div>

          <div className="w-8 h-0.5 bg-slate-800"></div>

          <div className="flex items-center space-x-2">
            <span
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                step === 'CONFIRMATION'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              3
            </span>
            <span className="text-sm font-semibold text-slate-300">Resultado</span>
          </div>
        </div>

        {/* Product summary header inside modal */}
        <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 mb-6">
          <img src={product.imageUrl} alt={product.name} className="w-16 h-16 rounded-xl object-cover" />
          <div className="flex-1">
            <h4 className="font-bold text-slate-100">{product.name}</h4>
            <p className="text-xs text-slate-400">Stock: {product.stock} unidades</p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Total a pagar</span>
            <span className="text-lg font-extrabold text-indigo-400">{formattedPrice}</span>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm mb-6 flex items-start space-x-3">
            <svg className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: DELIVERY INFO */}
        {step === 'DELIVERY_INFO' && (
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Datos de Envío</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nombre Completo del Destinatario</label>
                <input
                  type="text"
                  value={deliveryInfo.recipientName}
                  onChange={(e) => dispatch(updateDeliveryInfo({ recipientName: e.target.value }))}
                  placeholder="Ej: Juan Pérez"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100"
                />
                {formErrors.recipientName && <p className="text-xs text-rose-400 mt-1">{formErrors.recipientName}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Teléfono de Contacto</label>
                <input
                  type="tel"
                  value={deliveryInfo.recipientPhone}
                  onChange={(e) => dispatch(updateDeliveryInfo({ recipientPhone: e.target.value }))}
                  placeholder="Ej: 3001234567"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100"
                />
                {formErrors.recipientPhone && <p className="text-xs text-rose-400 mt-1">{formErrors.recipientPhone}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Dirección de Entrega</label>
              <input
                type="text"
                value={deliveryInfo.address}
                onChange={(e) => dispatch(updateDeliveryInfo({ address: e.target.value }))}
                placeholder="Ej: Calle 100 # 15-20 Apt 501"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100"
              />
              {formErrors.address && <p className="text-xs text-rose-400 mt-1">{formErrors.address}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Ciudad</label>
                <input
                  type="text"
                  value={deliveryInfo.city}
                  onChange={(e) => dispatch(updateDeliveryInfo({ city: e.target.value }))}
                  placeholder="Ej: Bogotá"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100"
                />
                {formErrors.city && <p className="text-xs text-rose-400 mt-1">{formErrors.city}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Departamento</label>
                <input
                  type="text"
                  value={deliveryInfo.department}
                  onChange={(e) => dispatch(updateDeliveryInfo({ department: e.target.value }))}
                  placeholder="Ej: Cundinamarca"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100"
                />
                {formErrors.department && <p className="text-xs text-rose-400 mt-1">{formErrors.department}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Código Postal</label>
                <input
                  type="text"
                  value={deliveryInfo.postalCode}
                  onChange={(e) => dispatch(updateDeliveryInfo({ postalCode: e.target.value }))}
                  placeholder="Ej: 110111"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100"
                />
                {formErrors.postalCode && <p className="text-xs text-rose-400 mt-1">{formErrors.postalCode}</p>}
              </div>
            </div>

            <div className="pt-6 flex justify-end">
              <button
                type="button"
                onClick={handleNextStep}
                className="gradient-button px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-lg flex items-center space-x-2"
              >
                <span>Continuar al Pago</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: CARD DETAILS */}
        {step === 'CARD_DETAILS' && (
          <form onSubmit={handleSubmitPayment} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-100">Tarjeta de Crédito / Débito</h3>

              {/* Sandbox Quick Fill helper */}
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => fillTestCard('APPROVED')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition font-medium"
                >
                  ⚡ Card Aprobada
                </button>
                <button
                  type="button"
                  onClick={() => fillTestCard('DECLINED')}
                  className="text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition font-medium"
                >
                  ⚡ Card Rechazada
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nombre del Titular</label>
              <input
                type="text"
                value={cardInfo.cardHolder}
                onChange={(e) => dispatch(updateCardInfo({ cardHolder: e.target.value.toUpperCase() }))}
                placeholder="Como aparece en la tarjeta"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100 tracking-wide uppercase"
              />
              {formErrors.cardHolder && <p className="text-xs text-rose-400 mt-1">{formErrors.cardHolder}</p>}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Número de Tarjeta</label>
              <input
                type="text"
                maxLength={19}
                value={cardInfo.number}
                onChange={(e) => dispatch(updateCardInfo({ number: e.target.value.replace(/\D/g, '') }))}
                placeholder="4242 4242 4242 4242"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100 tracking-widest font-mono"
              />
              {formErrors.number && <p className="text-xs text-rose-400 mt-1">{formErrors.number}</p>}
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Mes (MM)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={cardInfo.expMonth}
                  onChange={(e) => dispatch(updateCardInfo({ expMonth: e.target.value.replace(/\D/g, '') }))}
                  placeholder="12"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100 text-center font-mono"
                />
                {formErrors.expMonth && <p className="text-xs text-rose-400 mt-1">{formErrors.expMonth}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Año (YY)</label>
                <input
                  type="text"
                  maxLength={2}
                  value={cardInfo.expYear}
                  onChange={(e) => dispatch(updateCardInfo({ expYear: e.target.value.replace(/\D/g, '') }))}
                  placeholder="30"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100 text-center font-mono"
                />
                {formErrors.expYear && <p className="text-xs text-rose-400 mt-1">{formErrors.expYear}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">CVC</label>
                <input
                  type="password"
                  maxLength={4}
                  value={cardInfo.cvc}
                  onChange={(e) => dispatch(updateCardInfo({ cvc: e.target.value.replace(/\D/g, '') }))}
                  placeholder="123"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100 text-center font-mono"
                />
                {formErrors.cvc && <p className="text-xs text-rose-400 mt-1">{formErrors.cvc}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Número de Cuotas</label>
              <select
                value={installments}
                onChange={(e) => dispatch(setInstallments(Number(e.target.value)))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-sm text-slate-100"
              >
                {Array.from({ length: 36 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {n} {n === 1 ? 'cuota' : 'cuotas'}
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-6 flex justify-between items-center">
              <button
                type="button"
                onClick={() => dispatch(setStep('DELIVERY_INFO'))}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-sm font-semibold hover:bg-slate-700 transition"
              >
                Atrás
              </button>

              <button
                type="submit"
                className="gradient-button px-6 py-3 rounded-xl font-semibold text-sm text-white shadow-lg flex items-center space-x-2"
              >
                <span>Pagar con Wompi</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: PROCESSING */}
        {step === 'PROCESSING' && (
          <div className="py-12 text-center space-y-6">
            <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto"></div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">Procesando Transacción</h3>
              <p className="text-sm text-slate-400 mt-2">
                Conectando con la pasarela Wompi y reservando producto en inventario...
              </p>
            </div>
          </div>
        )}

        {/* STEP 4: CONFIRMATION */}
        {step === 'CONFIRMATION' && orderResult && (
          <div className="space-y-6">
            <div className="text-center space-y-2">
              <div
                className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center ${
                  orderResult.wompiStatus === 'APPROVED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : orderResult.wompiStatus === 'DECLINED'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {orderResult.wompiStatus === 'APPROVED' ? (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              <h3 className="text-xl font-extrabold text-slate-100">
                {orderResult.wompiStatus === 'APPROVED'
                  ? '¡Pago Aprobado!'
                  : orderResult.wompiStatus === 'DECLINED'
                  ? 'Transacción Rechazada'
                  : 'Transacción Pendiente'}
              </h3>

              <p className="text-sm text-slate-400">
                {orderResult.wompiStatus === 'APPROVED'
                  ? 'Tu orden ha sido procesada exitosamente y el inventario ha sido actualizado.'
                  : 'Wompi no pudo procesar el pago con los datos ingresados.'}
              </p>
            </div>

            {/* Details Box */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">ID de Usuario (Comprador)</span>
                <span className="font-mono text-indigo-400 font-bold">{orderResult.order.userId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">ID de Orden (Sistema)</span>
                <span className="font-mono text-slate-200">{orderResult.order.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400">ID Transacción Wompi</span>
                <span className="font-mono text-slate-200">{orderResult.wompiTransactionId}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">Monto Total</span>
                <span className="font-bold text-white text-sm">{formattedPrice}</span>
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={() => dispatch(closeCheckout())}
                className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 text-sm font-semibold hover:bg-slate-700 transition"
              >
                Cerrar
              </button>

              <a
                href={`/payment-result?transactionId=${orderResult.wompiTransactionId}&userId=${orderResult.order.userId}`}
                className="gradient-button px-6 py-2.5 rounded-xl font-semibold text-sm text-white shadow-lg inline-flex items-center space-x-2"
              >
                <span>Ver Resumen Completo</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
