import { describe, it, expect } from 'vitest';
import productReducer, {
  selectProduct,
  clearProductError,
  fetchProducts,
  fetchProductById,
} from '@/presentation/redux/slices/productSlice';
import type { Product } from '@/domain/entities/Product';

describe('productSlice Reducer', () => {
  const sampleProduct: Product = {
    id: 'prod-101',
    name: 'Gorra Urbana',
    description: 'Gorra estilo trucker',
    priceCents: 4500000,
    stock: 10,
    imageUrl: 'http://img.com/gorra.png',
    category: 'Ropa',
  };

  const initialState = {
    items: [],
    selectedProduct: null,
    loading: false,
    error: null,
  };

  it('debe manejar el estado inicial por defecto', () => {
    expect(productReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('debe seleccionar un producto con selectProduct', () => {
    const nextState = productReducer(initialState, selectProduct(sampleProduct));
    expect(nextState.selectedProduct).toEqual(sampleProduct);
  });

  it('debe limpiar el error con clearProductError', () => {
    const errorState = { ...initialState, error: 'Ocurrió un error' };
    const nextState = productReducer(errorState, clearProductError());
    expect(nextState.error).toBeNull();
  });

  describe('fetchProducts extraReducers', () => {
    it('debe poner loading en true en pending', () => {
      const state = productReducer(initialState, { type: fetchProducts.pending.type });
      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('debe actualizar items y poner loading en false en fulfilled', () => {
      const state = productReducer(
        { ...initialState, loading: true },
        { type: fetchProducts.fulfilled.type, payload: [sampleProduct] }
      );
      expect(state.loading).toBe(false);
      expect(state.items).toEqual([sampleProduct]);
    });

    it('debe guardar el mensaje de error en rejected', () => {
      const state = productReducer(
        { ...initialState, loading: true },
        { type: fetchProducts.rejected.type, payload: 'Error de servidor' }
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Error de servidor');
    });
  });

  describe('fetchProductById extraReducers', () => {
    it('debe actualizar selectedProduct en fulfilled', () => {
      const state = productReducer(
        { ...initialState, loading: true },
        { type: fetchProductById.fulfilled.type, payload: sampleProduct }
      );
      expect(state.loading).toBe(false);
      expect(state.selectedProduct).toEqual(sampleProduct);
    });

    it('debe asignar error en rejected', () => {
      const state = productReducer(
        { ...initialState, loading: true },
        { type: fetchProductById.rejected.type, payload: 'Producto no encontrado' }
      );
      expect(state.loading).toBe(false);
      expect(state.error).toBe('Producto no encontrado');
    });
  });
});
