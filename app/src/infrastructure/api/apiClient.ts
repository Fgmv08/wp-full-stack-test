import axios from 'axios'

const getBaseUrl = (): string => {
  // En producción usamos la URL absoluta del backend (inyectada en build time).
  // En desarrollo usamos /api (ruta relativa) para que el proxy de Vite
  // reenvíe la petición al backend — esto funciona tanto desde localhost
  // como desde otros dispositivos en la misma red Wi-Fi, porque el proxy
  // corre en la PC (no en el navegador del cliente).
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // Fallback: ruta relativa → el proxy de Vite maneja el reenvío
  return '/api'
}

export const apiClient = axios.create({
  baseURL: getBaseUrl(),
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Dynamically ensure request uses current hostname if changed
apiClient.interceptors.request.use((config) => {
  config.baseURL = getBaseUrl()
  return config
})

// Response interceptor — normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const axiosError = error as {
      response?: { data?: { error?: { message?: string } }; status?: number }
      message?: string
    }
    const message =
      axiosError.response?.data?.error?.message ??
      axiosError.message ??
      'Error de conexión con el servidor'
    return Promise.reject(new Error(message))
  },
)
