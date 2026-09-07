import React, { useState, useMemo } from 'react'
import type { Product } from '@/domain/entities/Product'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products: Product[]
  loading: boolean
  error: string | null
  onRetry: () => void
}

const ALL_CATEGORY = 'Todos'

export const ProductGrid: React.FC<ProductGridProps> = ({ products, loading, error, onRetry }) => {
  const [activeCategory, setActiveCategory] = useState<string>(ALL_CATEGORY)
  const [searchQuery, setSearchQuery] = useState('')

  // Collect unique categories from products
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category).filter(Boolean)))
    return [ALL_CATEGORY, ...cats]
  }, [products])

  // Filter products by category + search
  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory = activeCategory === ALL_CATEGORY || p.category === activeCategory
      const query = searchQuery.trim().toLowerCase()
      const matchesSearch =
        !query ||
        p.name.toLowerCase().includes(query) ||
        (p.description ?? '').toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
  }, [products, activeCategory, searchQuery])

  if (loading) {
    return (
      <div className="space-y-4">
        {/* Skeleton filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-slate-800 rounded-full h-7 w-20 animate-pulse flex-shrink-0" />
          ))}
        </div>
        <div className="grid grid-cols-1 min-[521px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-card rounded-2xl p-4 animate-pulse space-y-4">
              <div className="bg-slate-800 rounded-xl h-40 w-full" />
              <div className="bg-slate-800 h-6 rounded w-3/4" />
              <div className="bg-slate-800 h-4 rounded w-full" />
              <div className="bg-slate-800 h-10 rounded-xl w-full" />
            </div>
          ))}
        </div>
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

  return (
    <div className="space-y-4">
      {/* ── Filters ── */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative w-full">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M16.65 16.65A7.5 7.5 0 1116.65 2a7.5 7.5 0 010 14.65z" />
          </svg>
          <input
            id="product-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar productos..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              ×
            </button>
          )}
        </div>

        {/* Category pills – horizontal scrollable on mobile */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              id={`filter-${cat.toLowerCase().replace(/\s+/g, '-')}`}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border transition capitalize ${
                activeCategory === cat
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm shadow-indigo-500/30'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-indigo-500/50 hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="glass-card rounded-2xl p-8 text-center max-w-md mx-auto">
          <p className="text-slate-400 text-sm">
            {searchQuery
              ? `No se encontraron productos para "${searchQuery}".`
              : 'No hay productos en esta categoría.'}
          </p>
          <button
            type="button"
            onClick={() => { setActiveCategory(ALL_CATEGORY); setSearchQuery('') }}
            className="mt-4 text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline"
          >
            Ver todos
          </button>
        </div>
      ) : (
        <>
          <p className="text-xs text-slate-500">
            {filtered.length} {filtered.length === 1 ? 'producto' : 'productos'}{' '}
            {activeCategory !== ALL_CATEGORY ? `en "${activeCategory}"` : ''}
          </p>
          <div className="grid grid-cols-1 min-[521px]:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
