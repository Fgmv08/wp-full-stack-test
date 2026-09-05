import React, { useEffect } from 'react'
import { useAppDispatch, useAppSelector } from '../redux/store'
import { fetchProducts } from '../redux/slices/productSlice'
import { Header } from '../components/Header'
import { ProductGrid } from '../components/ProductGrid'
import { CheckoutModal } from '../components/CheckoutModal'

export const HomePage: React.FC = () => {
  const dispatch = useAppDispatch()
  const { items: products, loading, error } = useAppSelector((state) => state.product)

  useEffect(() => {
    dispatch(fetchProducts())
  }, [dispatch])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        {/* Hero Banner */}
        <section className="text-center space-y-4 max-w-3xl mx-auto pt-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <span>🚀 Prueba Técnica Onboarding Wompi</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            Compra segura con <span className="gradient-text">Pasarela Wompi</span>
          </h1>
          <p className="text-base sm:text-lg text-slate-400 leading-relaxed">
            Selecciona tu producto, ingresa tus datos de entrega y realiza la transacción de forma rápida e integrada.
          </p>
        </section>

        {/* Product Catalog Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <h2 className="text-2xl font-bold text-slate-100">Catálogo de Productos</h2>
            <span className="text-xs text-slate-400">{products.length} productos disponibles</span>
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

      {/* Footer */}
      <footer className="w-full border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>© 2026 Wompi Store — Fullstack Jr Technical Test Solution</p>
      </footer>
    </div>
  )
}
