import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { openOrdersModal, fetchOrders } from '../redux/slices/orderSlice';

// Default user name from seed (Frank Muriel) – no need for a separate API call
const DEFAULT_USER_FIRST_NAME = 'Frank';
const DEFAULT_USER_INITIAL = 'F';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders } = useAppSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-800/80 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div className="truncate">
            <span className="font-black text-base sm:text-xl tracking-tight gradient-text">Shop Store</span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
          {/* Orders Button */}
          <button
            type="button"
            id="btn-mis-pedidos"
            onClick={() => dispatch(openOrdersModal())}
            className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 transition text-xs font-semibold text-slate-200 shadow-sm"
          >
            <span>📦</span>
            <span className="hidden sm:inline">Mis Pedidos</span>
            <span className="px-1.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-bold leading-5">
              {orders.length}
            </span>
          </button>

          {/* User Avatar with greeting */}
          <div
            id="user-avatar-header"
            className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-800"
          >
            {/* Initial avatar bubble */}
            <div
              aria-label={`Usuario: ${DEFAULT_USER_FIRST_NAME}`}
              className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black text-sm shadow-md shadow-indigo-500/20 flex-shrink-0 select-none"
            >
              {DEFAULT_USER_INITIAL}
            </div>
            {/* Greeting – visible on sm+ */}
            <div className="hidden sm:flex flex-col leading-none">
              <span className="text-[10px] text-slate-500 font-medium">Hola,</span>
              <span className="text-xs text-slate-200 font-bold">{DEFAULT_USER_FIRST_NAME}</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
