import { configureStore } from '@reduxjs/toolkit'
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux'
import productReducer from './slices/productSlice'
import checkoutReducer from './slices/checkoutSlice'
import transactionReducer from './slices/transactionSlice'
import orderReducer from './slices/orderSlice'
import {
  loadCheckoutState,
  saveCheckoutState,
} from '@/shared/utils/checkoutPersistence'

// ── Rehydratación al iniciar ──────────────────────────────────────────────────
// Se carga el checkout persistido (si existe) para restaurar el modal tras refresh.
const persistedCheckout = loadCheckoutState()

export const store = configureStore({
  reducer: {
    product: productReducer,
    checkout: checkoutReducer,
    transaction: transactionReducer,
    order: orderReducer,
  },
  // Inyectamos el estado recuperado como preloadedState del slice checkout.
  // Los campos transitorios (loading, error, orderResult) quedan en su valor
  // por defecto gracias al initialState del slice.
  ...(persistedCheckout
    ? {
        preloadedState: {
          checkout: {
            // Campos persistidos
            isOpen: persistedCheckout.isOpen,
            step: persistedCheckout.step as any,
            product: persistedCheckout.product as any,
            deliveryInfo: persistedCheckout.deliveryInfo as any,
            cardInfo: persistedCheckout.cardInfo as any,
            expiryInput: persistedCheckout.expiryInput,
            installments: persistedCheckout.installments,
            dataPaymentResult: persistedCheckout.dataPaymentResult as any,
            // Campos transitorios: siempre frescos
            loading: false,
            error: null,
            orderResult: null,
          },
        },
      }
    : {}),
})

// ── Persistencia reactiva ─────────────────────────────────────────────────────
// Cada vez que cambia el store, guardamos solo los campos del checkout
// que tienen sentido recuperar tras un refresh.
let previousIsOpen: boolean | undefined

store.subscribe(() => {
  const checkout = store.getState().checkout
  const { isOpen } = checkout

  // Optimización: solo escribir en localStorage si isOpen cambió a false
  // (para limpiar) o si el checkout está abierto (para guardar).
  if (!isOpen) {
    // Si se acaba de cerrar, la limpieza la hace closeCheckout/resetCheckout
    // directamente; aquí simplemente no guardamos.
    if (previousIsOpen === true) {
      // El cierre se manejó en el slice – no hacemos nada extra.
    }
  } else {
    saveCheckoutState({
      isOpen: checkout.isOpen,
      step: checkout.step,
      product: checkout.product,
      deliveryInfo: checkout.deliveryInfo,
      cardInfo: checkout.cardInfo,
      expiryInput: checkout.expiryInput,
      installments: checkout.installments,
      dataPaymentResult: checkout.dataPaymentResult,
    })
  }

  previousIsOpen = isOpen
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch

export const useAppDispatch = () => useDispatch<AppDispatch>()
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
