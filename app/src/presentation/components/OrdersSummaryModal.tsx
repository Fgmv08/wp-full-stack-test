import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { closeOrdersModal, fetchOrders } from '../redux/slices/orderSlice';

export const OrdersSummaryModal: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders, loading, error, isOrdersModalOpen } = useAppSelector((state) => state.order);

  useEffect(() => {
    if (isOrdersModalOpen) {
      dispatch(fetchOrders());
    }
  }, [isOrdersModalOpen, dispatch]);

  if (!isOrdersModalOpen) return null;

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(cents / 100);

  const formatDate = (dateString: string) => {
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('es-CO', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col glass-modal rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/80 overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-800 bg-slate-900/60 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">Pedidos en el Sistema</h3>
              <p className="text-xs text-slate-400">Consulta el historial y estado de órdenes registradas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => dispatch(closeOrdersModal())}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body with smooth scrolling */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar">
          {loading && orders.length === 0 ? (
            <div className="py-12 text-center space-y-3">
              <div className="w-10 h-10 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin mx-auto"></div>
              <p className="text-xs text-slate-400">Cargando pedidos...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs text-center">
              {error}
            </div>
          ) : orders.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p className="text-sm font-semibold text-slate-300">Aún no hay pedidos registrados</p>
              <p className="text-xs text-slate-500">Realiza tu primera compra para verla reflejada aquí en tiempo real.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const isApproved = order.status === 'APPROVED';
                const isDeclined = order.status === 'DECLINED';

                return (
                  <div
                    key={order.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-slate-700 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                            isApproved
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : isDeclined
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {order.status}
                        </span>

                        <span className="text-xs text-slate-400 font-mono truncate">
                          Ref: {order.reference || order.id.slice(0, 8)}
                        </span>
                      </div>

                      <div className="text-xs text-slate-300">
                        <strong>Destino:</strong>{' '}
                        {order.deliveryInfo
                          ? `${order.deliveryInfo.recipientName} • ${order.deliveryInfo.city}, ${order.deliveryInfo.department}`
                          : 'No especificado'}
                      </div>

                      {order.cardInfo && (
                        <div className="text-xs text-slate-400 flex items-center space-x-1.5">
                          <span className="font-semibold text-slate-300">{order.cardInfo.brand}</span>
                          <span>•••• {order.cardInfo.lastFour}</span>
                          {order.cardInfo.cardHolder && (
                            <span className="text-slate-500">({order.cardInfo.cardHolder})</span>
                          )}
                        </div>
                      )}

                      <div className="text-[11px] text-slate-500">
                        {formatDate(order.createdAt)}
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                      <div className="text-sm sm:text-base font-extrabold text-white">
                        {formatPrice(order.totalAmountCents)}
                      </div>

                      {order.wompiTransactionId && (
                        <a
                          href={`/payment-result?transactionId=${order.wompiTransactionId}`}
                          className="text-xs text-indigo-400 hover:text-indigo-300 font-medium underline mt-1"
                        >
                          Ver transacción
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={() => dispatch(fetchOrders())}
            className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center space-x-1 font-semibold"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Actualizar</span>
          </button>

          <button
            type="button"
            onClick={() => dispatch(closeOrdersModal())}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
