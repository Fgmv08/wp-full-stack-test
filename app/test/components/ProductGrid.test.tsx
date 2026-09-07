import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ProductGrid } from '@/presentation/components/ProductGrid';
import checkoutReducer from '@/presentation/redux/slices/checkoutSlice';
import type { Product } from '@/domain/entities/Product';

function renderWithStore(ui: React.ReactElement) {
  const store = configureStore({
    reducer: {
      checkout: checkoutReducer,
    },
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('ProductGrid Component', () => {
  const sampleProducts: Product[] = [
    {
      id: 'p1',
      name: 'Camisa Lino',
      description: 'Camisa fresca de verano',
      priceCents: 8000000,
      stock: 10,
      imageUrl: 'http://img.com/camisa.jpg',
      category: 'Ropa',
    },
    {
      id: 'p2',
      name: 'Audífonos Pro',
      description: 'Cancelación de ruido activa',
      priceCents: 35000000,
      stock: 4,
      imageUrl: 'http://img.com/audio.jpg',
      category: 'Tecnología',
    },
    {
      id: 'p3',
      name: 'Zapatillas Runner',
      description: 'Zapatillas ligeras',
      priceCents: 20000000,
      stock: 0,
      imageUrl: 'http://img.com/shoes.jpg',
      category: 'Calzado',
    },
  ];

  it('debe renderizar el buscador, las categorías únicas y las tarjetas de productos', () => {
    renderWithStore(
      <ProductGrid
        products={sampleProducts}
        loading={false}
        error={null}
        onRetry={() => {}}
      />
    );

    expect(screen.getByPlaceholderText('Buscar productos...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /todos/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /ropa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /tecnología/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /calzado/i })).toBeInTheDocument();

    expect(screen.getByText('Camisa Lino')).toBeInTheDocument();
    expect(screen.getByText('Audífonos Pro')).toBeInTheDocument();
    expect(screen.getByText('Zapatillas Runner')).toBeInTheDocument();
  });

  it('debe filtrar productos al seleccionar una categoría específica', () => {
    renderWithStore(
      <ProductGrid
        products={sampleProducts}
        loading={false}
        error={null}
        onRetry={() => {}}
      />
    );

    const techCategoryButton = screen.getByRole('button', { name: /tecnología/i });
    fireEvent.click(techCategoryButton);

    expect(screen.getByText('Audífonos Pro')).toBeInTheDocument();
    expect(screen.queryByText('Camisa Lino')).not.toBeInTheDocument();
    expect(screen.queryByText('Zapatillas Runner')).not.toBeInTheDocument();
  });

  it('debe filtrar productos al escribir en el buscador de texto', () => {
    renderWithStore(
      <ProductGrid
        products={sampleProducts}
        loading={false}
        error={null}
        onRetry={() => {}}
      />
    );

    const searchInput = screen.getByPlaceholderText('Buscar productos...');
    fireEvent.change(searchInput, { target: { value: 'Cancelación' } });

    expect(screen.getByText('Audífonos Pro')).toBeInTheDocument();
    expect(screen.queryByText('Camisa Lino')).not.toBeInTheDocument();
  });

  it('debe mostrar mensaje de reintento si existe un error y llamar a onRetry', () => {
    const handleRetry = vi.fn();

    renderWithStore(
      <ProductGrid
        products={[]}
        loading={false}
        error="Error de conexión con el backend"
        onRetry={handleRetry}
      />
    );

    expect(screen.getByText('Error al cargar productos')).toBeInTheDocument();
    expect(screen.getByText('Error de conexión con el backend')).toBeInTheDocument();

    const retryButton = screen.getByRole('button', { name: /reintentar/i });
    fireEvent.click(retryButton);

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});
