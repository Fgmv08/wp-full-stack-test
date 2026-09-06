import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit'
import type { Product } from '@/domain/entities/Product'
import type { DeliveryInfo } from '@/domain/entities/Cart'
import type { CardInfo, Order } from '@/domain/entities/Order'
import { HttpPaymentRepository } from '@/infrastructure/api/HttpPaymentRepository'
import type { CreateOrderResult, DataPaymentResult } from '@/domain/ports/IPaymentRepository'

const paymentRepo = new HttpPaymentRepository()

export type CheckoutStep = 'CARD_DETAILS' | 'DELIVERY_INFO' | 'PROCESSING' | 'CONFIRMATION'

interface CheckoutState {
  isOpen: boolean
  step: CheckoutStep
  product: Product | null
  deliveryInfo: DeliveryInfo
  cardInfo: CardInfo
  expiryInput: string // combined MM/YY
  installments: number
  loading: boolean
  error: string | null
  orderResult: CreateOrderResult | null
  dataPaymentResult: DataPaymentResult | null
}

const defaultDeliveryInfo: DeliveryInfo = {
  recipientName: 'Carlos Mendoza',
  recipientPhone: '3001234567',
  address: 'Calle 100 # 15-20 Apt 501',
  city: 'Bogotá',
  department: 'Cundinamarca',
  postalCode: '110111',
}

const defaultCardInfo: CardInfo = {
  number: '',
  cvc: '',
  expMonth: '',
  expYear: '',
  cardHolder: 'CARLOS MENDOZA',
  brand: 'UNKNOWN',
}

const initialState: CheckoutState = {
  isOpen: false,
  step: 'CARD_DETAILS',
  product: null,
  deliveryInfo: defaultDeliveryInfo,
  cardInfo: defaultCardInfo,
  expiryInput: '',
  installments: 1,
  loading: false,
  error: null,
  orderResult: null,
  dataPaymentResult: null,
}

export const requestDataPayment = createAsyncThunk(
  'checkout/requestDataPayment',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = (getState() as any).checkout as CheckoutState
      if (!state.product) {
        throw new Error('No hay un producto seleccionado')
      }

      const redirectUrl = `${window.location.origin}/payment-result`

      const result = await paymentRepo.getDataPayment({
        productId: state.product.id,
        card: state.cardInfo,
        deliveryInfo: state.deliveryInfo,
        redirectUrl,
        installments: Number(state.installments) || 1,
      })

      return result
    } catch (err: any) {
      return rejectWithValue(
        err.response?.data?.error?.message || err.message || 'Error al preparar los datos de pago con Wompi'
      )
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
      state.step = 'CARD_DETAILS' // Step 1 is now Credit Card
      state.error = null
      state.orderResult = null
      state.dataPaymentResult = null
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
    setExpiryInput: (state, action: PayloadAction<string>) => {
      state.expiryInput = action.payload
      const clean = action.payload.replace(/\D/g, '')
      if (clean.length >= 2) {
        state.cardInfo.expMonth = clean.slice(0, 2)
      }
      if (clean.length >= 4) {
        state.cardInfo.expYear = clean.slice(2, 4)
      }
    },
    setInstallments: (state, action: PayloadAction<number>) => {
      state.installments = action.payload
    },
    resetCheckout: () => initialState,
  },
  extraReducers: (builder) => {
    builder
      .addCase(requestDataPayment.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(requestDataPayment.fulfilled, (state, action: PayloadAction<DataPaymentResult>) => {
        state.loading = false
        state.dataPaymentResult = action.payload
      })
      .addCase(requestDataPayment.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  openCheckout,
  closeCheckout,
  setStep,
  updateDeliveryInfo,
  updateCardInfo,
  setExpiryInput,
  setInstallments,
  resetCheckout,
} = checkoutSlice.actions

export default checkoutSlice.reducer
