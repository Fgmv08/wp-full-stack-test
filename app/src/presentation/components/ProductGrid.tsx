import React from 'react'
import type { Product } from '@/domain/entities/Product'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products: Product[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((n) => (
          <div key={n} className="glass-card rounded-2xl p-4 animate-pulse space-y-4">
            <div className="bg-slate-800 rounded-xl h-48 w-full"></div>
            <div className="bg-slate-800 h-6 rounded w-3/4"></div>
            <div className="bg-slate-800 h-4 rounded w-full"></div>
            <div className="bg-slate-800 h-10 rounded-xl w-full"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center max-w-md mx-auto border-rose-900/50">
        <div className="w-12 h-12 rounded-full bg-rose-500/10 text-rose-400 mx-auto flex items-center justify-center mb-4">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-slate-100">Error al cargar productos</h3>
        <p className="text-sm text-slate-400 mt-2 mb-6">{error}</p>
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition"
        >
          Reintentar
        </button>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8 text-center max-w-md mx-auto">
        <p className="text-slate-400">No hay productos disponibles por el momento.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  )
}
