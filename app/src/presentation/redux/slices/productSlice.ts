import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Product } from '@/domain/entities/Product'
import { HttpProductRepository } from '@/infrastructure/api/HttpProductRepository'

const productRepo = new HttpProductRepository()

interface ProductState {
  items: Product[]
  selectedProduct: Product | null
  loading: boolean
  error: string | null
}

const initialState: ProductState = {
  items: [],
  selectedProduct: null,
  loading: false,
  error: null,
}

export const fetchProducts = createAsyncThunk(
  'product/fetchProducts',
  async (_, { rejectWithValue }) => {
    try {
      const products = await productRepo.getAll()
      return products
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || err.message || 'Error fetching products')
    }
  }
)

export const fetchProductById = createAsyncThunk(
  'product/fetchProductById',
  async (id: string, { rejectWithValue }) => {
    try {
      const product = await productRepo.getById(id)
      return product
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || err.message || 'Error fetching product')
    }
  }
)

const productSlice = createSlice({
  name: 'product',
  initialState,
  reducers: {
    selectProduct: (state, action: PayloadAction<Product | null>) => {
      state.selectedProduct = action.payload
    },
    clearProductError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchProducts
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<Product[]>) => {
        state.loading = false
        state.items = action.payload
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      // fetchProductById
      .addCase(fetchProductById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProductById.fulfilled, (state, action: PayloadAction<Product>) => {
        state.loading = false
        state.selectedProduct = action.payload
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { selectProduct, clearProductError } = productSlice.actions
export default productSlice.reducer
