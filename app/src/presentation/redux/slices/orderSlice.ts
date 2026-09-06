import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Order } from '@/domain/entities/Order'
import { HttpPaymentRepository } from '@/infrastructure/api/HttpPaymentRepository'

const paymentRepo = new HttpPaymentRepository()

interface OrderState {
  orders: Order[]
  loading: boolean
  error: string | null
  isOrdersModalOpen: boolean
}

const initialState: OrderState = {
  orders: [],
  loading: false,
  error: null,
  isOrdersModalOpen: false,
}

export const fetchOrders = createAsyncThunk(
  'order/fetchOrders',
  async (_, { rejectWithValue }) => {
    try {
      const orders = await paymentRepo.getOrders()
      return orders
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || err.message || 'Error al cargar pedidos')
    }
  }
)

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    openOrdersModal: (state) => {
      state.isOrdersModalOpen = true
    },
    closeOrdersModal: (state) => {
      state.isOrdersModalOpen = false
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
        state.loading = false
        state.orders = action.payload
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { openOrdersModal, closeOrdersModal } = orderSlice.actions
export default orderSlice.reducer
