import React, { useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../redux/store'
import { confirmPaymentStatus, fetchTransactionStatus } from '../redux/slices/transactionSlice'
import { Header } from '../components/Header'

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const dispatch = useAppDispatch()
  const { transaction, loading, error } = useAppSelector((state) => state.transaction)

  // Wompi redirect parameter is usually `id` or `transactionId`
  const wompiTxId = searchParams.get('id') || searchParams.get('transactionId') || ''
  const userIdParam = searchParams.get('userId') || ''

  useEffect(() => {
    if (wompiTxId) {
      // First confirm payment with Wompi to get latest status, then fetch
      dispatch(confirmPaymentStatus(wompiTxId))
    }
  }, [wompiTxId, dispatch])

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(cents / 100)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 flex flex-col items-center justify-center">
        {!wompiTxId ? (
          <div className="glass-card rounded-3xl p-8 text-center max-w-md w-full border border-slate-800">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 mx-auto flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-100">Sin ID de Transacción</h2>
            <p className="text-sm text-slate-400 mt-2 mb-6">
              No se proporcionó un ID de transacción válido en la URL de redirección.
            </p>
            <Link
              to="/"
              className="gradient-button px-6 py-2.5 rounded-xl font-semibold text-sm text-white inline-block shadow-lg"
            >
              Volver a la Tienda
            </Link>
          </div>
        ) : loading ? (
          <div className="glass-card rounded-3xl p-12 text-center max-w-md w-full border border-slate-800 space-y-4">
            <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto"></div>
            <h3 className="text-lg font-bold text-slate-100">Verificando Pago con Backend y Wompi...</h3>
            <p className="text-xs text-slate-400">Consultando estado de transacción ID: {wompiTxId}</p>
          </div>
        ) : error ? (
          <div className="glass-card rounded-3xl p-8 text-center max-w-md w-full border border-rose-900/50 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-slate-100">Error en la Consulta</h3>
            <p className="text-sm text-slate-400">{error}</p>
            <div className="pt-4">
              <Link
                to="/"
                className="gradient-button px-6 py-2.5 rounded-xl font-semibold text-sm text-white inline-block shadow-lg"
              >
                Volver a la Tienda
              </Link>
            </div>
          </div>
        ) : transaction ? (
          <div className="glass-modal w-full rounded-3xl p-6 sm:p-10 border border-slate-800 shadow-2xl space-y-8">
            {/* Header banner */}
            <div className="text-center space-y-3">
              <div
                className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                  transaction.wompiStatus === 'APPROVED'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                    : transaction.wompiStatus === 'DECLINED'
                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                }`}
              >
                {transaction.wompiStatus === 'APPROVED' ? (
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>

              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100">
                Resultado de Transacción Wompi
              </h2>

              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400">Estado Wompi:</span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    transaction.wompiStatus === 'APPROVED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : transaction.wompiStatus === 'DECLINED'
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {transaction.wompiStatus}
                </span>
              </div>
            </div>

            {/* Buyer User ID Card - Highlighting User ID as requested */}
            <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <span className="text-xs text-indigo-300 font-semibold block">ID del Usuario Comprador</span>
                  <span className="text-sm font-mono font-bold text-white tracking-wide">
                    {transaction.order?.userId || userIdParam || 'N/A'}
                  </span>
                </div>
              </div>
              <span className="text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 font-mono">
                Consultado en Backend DB
              </span>
            </div>

            {/* Detailed Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Order Info */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">
                  Detalles de la Orden
                </h4>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">ID de Orden:</span>
                  <span className="font-mono text-slate-200">{transaction.order?.id}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Estado Interno:</span>
                  <span className="font-semibold text-indigo-400">{transaction.order?.status}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Monto Total:</span>
                  <span className="font-bold text-white">{formatPrice(transaction.order?.totalAmountCents || 0)}</span>
                </div>
              </div>

              {/* Wompi Payment Info */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">
                  Pasarela Wompi
                </h4>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">ID Transacción:</span>
                  <span className="font-mono text-slate-200">{transaction.wompiTransactionId}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Respuesta Wompi:</span>
                  <span className="font-semibold text-slate-200">{transaction.wompiStatus}</span>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            {transaction.order?.deliveryInfo && (
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="font-bold text-sm text-slate-200 border-b border-slate-800 pb-2">
                  Información de Entrega
                </h4>
                <p className="text-xs text-slate-300">
                  <strong className="text-slate-400">Destinatario:</strong> {transaction.order.deliveryInfo.recipientName} ({transaction.order.deliveryInfo.recipientPhone})
                </p>
                <p className="text-xs text-slate-300">
                  <strong className="text-slate-400">Dirección:</strong> {transaction.order.deliveryInfo.address}, {transaction.order.deliveryInfo.city}, {transaction.order.deliveryInfo.department} (CP: {transaction.order.deliveryInfo.postalCode})
                </p>
              </div>
            )}

            {/* Footer buttons */}
            <div className="pt-4 flex justify-center">
              <Link
                to="/"
                className="gradient-button px-8 py-3 rounded-xl font-bold text-sm text-white shadow-xl flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Volver a la Tienda</span>
              </Link>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  )
}
