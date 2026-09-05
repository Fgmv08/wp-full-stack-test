import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { TransactionResult } from '@/domain/ports/IPaymentRepository'
import { HttpPaymentRepository } from '@/infrastructure/api/HttpPaymentRepository'

const paymentRepo = new HttpPaymentRepository()

interface TransactionState {
  transaction: TransactionResult | null
  loading: boolean
  error: string | null
}

const initialState: TransactionState = {
  transaction: null,
  loading: false,
  error: null,
}

export const fetchTransactionStatus = createAsyncThunk(
  'transaction/fetchTransactionStatus',
  async (wompiTransactionId: string, { rejectWithValue }) => {
    try {
      const result = await paymentRepo.getTransaction(wompiTransactionId)
      return result
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || err.message || 'Error fetching transaction')
    }
  }
)

export const confirmPaymentStatus = createAsyncThunk(
  'transaction/confirmPaymentStatus',
  async (wompiTransactionId: string, { rejectWithValue }) => {
    try {
      const result = await paymentRepo.confirmPayment(wompiTransactionId)
      return result
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || err.message || 'Error confirming payment')
    }
  }
)

const transactionSlice = createSlice({
  name: 'transaction',
  initialState,
  reducers: {
    clearTransaction: (state) => {
      state.transaction = null
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactionStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTransactionStatus.fulfilled, (state, action: PayloadAction<TransactionResult>) => {
        state.loading = false
        state.transaction = action.payload
      })
      .addCase(fetchTransactionStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      .addCase(confirmPaymentStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(confirmPaymentStatus.fulfilled, (state, action: PayloadAction<TransactionResult>) => {
        state.loading = false
        state.transaction = action.payload
      })
      .addCase(confirmPaymentStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { clearTransaction } = transactionSlice.actions
export default transactionSlice.reducer
