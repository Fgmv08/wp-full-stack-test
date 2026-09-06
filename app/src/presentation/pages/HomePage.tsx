import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../redux/store'
import { fetchProducts } from '../redux/slices/productSlice'
import { Header } from '../components/Header'
import { ProductGrid } from '../components/ProductGrid'
import { CheckoutModal } from '../components/CheckoutModal'
import { OrdersSummaryModal } from '../components/OrdersSummaryModal'

export const HomePage: React.FC = () => {
  const dispatch = useAppDispatch()
  const { items: products, loading, error } = useAppSelector((state) => state.product)

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8 sm:space-y-10">
        {/* Hero Banner */}
        <section className="text-center space-y-3 sm:space-y-4 max-w-3xl mx-auto pt-2 sm:pt-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <span>🚀 Prueba Técnica Onboarding Wompi</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            Compra segura con <span className="gradient-text">Pasarela Wompi</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-2xl mx-auto">
            Selecciona tu producto, ingresa los datos de pago y entrega, y procesa la transacción de forma inmediata y segura con el Widget oficial de Wompi.
          </p>
        </section>

        {/* Product Catalog Section */}
        <section className="space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-100">Catálogo de Productos</h2>
              <p className="text-xs text-slate-400">Stock en tiempo real y precios con IVA incluido</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-indigo-400 font-semibold self-start sm:self-auto">
              {products.length} productos en tienda
            </span>
          </div>

          <ProductGrid
            products={products}
            loading={loading}
            error={error}
            onRetry={() => dispatch(fetchProducts())}
          />
        </section>
      </main>

      {/* Checkout Modal */}
      <CheckoutModal />

      {/* Orders Summary Modal */}
      <OrdersSummaryModal />

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 bg-slate-950">
        <p>© 2026 Wompi Store — Solución Prueba Técnica Fullstack Jr</p>
      </footer>
    </div>
  )
}
