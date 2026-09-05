import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Product } from '@/domain/entities/Product'
import type { DeliveryInfo } from '@/domain/entities/Cart'
import type { CardInfo, Order } from '@/domain/entities/Order'
import { HttpPaymentRepository } from '@/infrastructure/api/HttpPaymentRepository'
import type { CreateOrderResult } from '@/domain/ports/IPaymentRepository'

const paymentRepo = new HttpPaymentRepository()

export type CheckoutStep = 'DELIVERY_INFO' | 'CARD_DETAILS' | 'PROCESSING' | 'CONFIRMATION'

interface CheckoutState {
  isOpen: boolean
  step: CheckoutStep
  product: Product | null
  deliveryInfo: DeliveryInfo
  cardInfo: CardInfo
  installments: number
  loading: boolean
  error: string | null
  orderResult: CreateOrderResult | null
}

const initialDeliveryInfo: DeliveryInfo = {
  address: '',
  city: '',
  department: '',
  postalCode: '',
  recipientName: '',
  recipientPhone: '',
}

const initialCardInfo: CardInfo = {
  number: '',
  cvc: '',
  expMonth: '',
  expYear: '',
  cardHolder: '',
}

const initialState: CheckoutState = {
  isOpen: false,
  step: 'DELIVERY_INFO',
  product: null,
  deliveryInfo: initialDeliveryInfo,
  cardInfo: initialCardInfo,
  installments: 1,
  loading: false,
  error: null,
  orderResult: null,
}

export const processPayment = createAsyncThunk(
  'checkout/processPayment',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as any).checkout as CheckoutState
      if (!state.product) {
        throw new Error('No product selected for payment')
      }

      const redirectUrl = `${window.location.origin}/payment-result`

      const result = await paymentRepo.createOrder({
        productId: state.product.id,
        card: state.cardInfo,
        deliveryInfo: state.deliveryInfo,
        redirectUrl,
        installments: Number(state.installments) || 1,
      })

      return result
    } catch (err: any) {
      return rejectWithValue(err.response?.data?.error?.message || err.message || 'Payment processing failed')
    }
  }
)

const checkoutSlice = createSlice({
  name: 'checkout',
  initialState,
  reducers: {
    openCheckout: (state, action: PayloadAction<Product>) => {
      state.isOpen = true
      state.product = action.payload
      state.step = 'DELIVERY_INFO'
      state.error = null
      state.orderResult = null
    },
    closeCheckout: (state) => {
      state.isOpen = false
      state.error = null
    },
    setStep: (state, action: PayloadAction<CheckoutStep>) => {
      state.step = action.payload
    },
    updateDeliveryInfo: (state, action: PayloadAction<Partial<DeliveryInfo>>) => {
      state.deliveryInfo = { ...state.deliveryInfo, ...action.payload }
    },
    updateCardInfo: (state, action: PayloadAction<Partial<CardInfo>>) => {
      state.cardInfo = { ...state.cardInfo, ...action.payload }
    },
    setInstallments: (state, action: PayloadAction<number>) => {
      state.installments = action.payload
    },
    resetCheckout: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(processPayment.pending, (state) => {
        state.loading = true
        state.step = 'PROCESSING'
        state.error = null
      })
      .addCase(processPayment.fulfilled, (state, action: PayloadAction<CreateOrderResult>) => {
        state.loading = false
        state.orderResult = action.payload
        state.step = 'CONFIRMATION'
      })
      .addCase(processPayment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
        state.step = 'CARD_DETAILS'
      })
  },
})

export const {
  openCheckout,
  closeCheckout,
  setStep,
  updateDeliveryInfo,
  updateCardInfo,
  setInstallments,
  resetCheckout,
} = checkoutSlice.actions

export default checkoutSlice.reducer
