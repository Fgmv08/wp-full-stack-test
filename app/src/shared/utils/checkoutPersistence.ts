/**
 * checkoutPersistence.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Helpers de persistencia del estado de checkout en localStorage.
 * Se usa de forma manual (sin redux-persist) para mantener una dependencia cero
 * y respetar la arquitectura existente.
 *
 * Solo se persisten los campos "recuperables" tras un refresh:
 *   product, step, deliveryInfo, cardInfo, expiryInput, installments,
 *   dataPaymentResult e isOpen.
 *
 * Los campos transitorios (loading, error, orderResult) NO se persisten.
 */

const STORAGE_KEY = 'checkout_state_v1';

/** Sub-tipo de CheckoutState que se persiste */
export interface PersistedCheckoutState {
  isOpen: boolean;
  step: string;
  product: unknown;
  deliveryInfo: unknown;
  cardInfo: unknown;
  expiryInput: string;
  installments: number;
  dataPaymentResult: unknown;
}

/**
 * Carga el estado persistido desde localStorage.
 * Devuelve undefined si no existe o si el JSON está corrupto.
 */
export function loadCheckoutState(): PersistedCheckoutState | undefined {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return undefined;
    return JSON.parse(raw) as PersistedCheckoutState;
  } catch {
    // JSON inválido – ignorar silenciosamente
    return undefined;
  }
}

/**
 * Guarda únicamente los campos relevantes en localStorage.
 * Se llama desde store.subscribe() después de cada dispatch.
 */
export function saveCheckoutState(state: PersistedCheckoutState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded u otro error – ignorar silenciosamente
  }
}

/** Elimina el estado guardado (al cerrar o resetear el checkout). */
export function clearCheckoutState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignorar
  }
}
