import React from 'react'
import type { Product } from '@/domain/entities/Product'
import { useAppDispatch } from '../redux/store'
import { openCheckout } from '../redux/slices/checkoutSlice'

interface ProductCardProps {
  product: Product
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const dispatch = useAppDispatch()

  const formattedPrice = new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(product.priceCents / 100)

  const isOutOfStock = product.stock <= 0

  return (
    <div className="group glass-card rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col h-full border border-slate-800/80">
      {/* Image container */}
      <div className="relative aspect-video sm:aspect-square w-full overflow-hidden bg-slate-900">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60"></div>
        
        {/* Category tag */}
        <span className="absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-slate-300 border border-slate-700/50">
          {product.category}
        </span>

        {/* Stock badge */}
        <span
          className={`absolute top-3 right-3 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-md border ${
            isOutOfStock
              ? 'bg-rose-950/80 text-rose-300 border-rose-800/50'
              : product.stock <= 5
              ? 'bg-amber-950/80 text-amber-300 border-amber-800/50'
              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800/50'
          }`}
        >
          {isOutOfStock ? 'Agotado' : `${product.stock} disponibles`}
        </span>
      </div>

      {/* Details */}
      <div className="p-5 flex flex-col flex-1 justify-between space-y-4">
        <div>
          <h3 className="text-lg font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
            {product.name}
          </h3>
          <p className="mt-2 text-sm text-slate-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        <div className="pt-4 border-t border-slate-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400 block font-medium">Precio final</span>
            <span className="text-xl font-black text-white tracking-tight">{formattedPrice}</span>
          </div>

          <button
            onClick={() => dispatch(openCheckout(product))}
            disabled={isOutOfStock}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center space-x-2 ${
              isOutOfStock
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'gradient-button text-white shadow-lg shadow-indigo-500/25 active:scale-95'
            }`}
          >
            <span>{isOutOfStock ? 'Sin Stock' : 'Pagar'}</span>
            {!isOutOfStock && (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
