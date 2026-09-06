import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../redux/store';
import { openOrdersModal, fetchOrders } from '../redux/slices/orderSlice';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { orders } = useAppSelector((state) => state.order);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  return (
    <header className="sticky top-0 z-40 w-full glass-card border-b border-slate-800/80 shadow-lg backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-md shadow-indigo-500/20 flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <div className="truncate">
            <span className="font-black text-lg sm:text-xl tracking-tight gradient-text">Shop Store</span>
            <span className="hidden sm:inline-block ml-2 text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-medium">
              Fullstack Jr Test
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-shrink-0">
          {/* Orders Button */}
          <button
            type="button"
            onClick={() => dispatch(openOrdersModal())}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-800 transition text-xs font-semibold text-slate-200 shadow-sm"
          >
            <span>📦</span>
            <span className="hidden sm:inline">Mis Pedidos</span>
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[11px] font-bold">
              {orders.length}
            </span>
          </button>

          {/* Sandbox Indicator */}
          <div className="hidden md:flex items-center text-xs text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
            Wompi Sandbox
          </div>
        </div>
      </div>
    </header>
  );
};
