import axios from 'axios'

const getBaseUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:8080/api'
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
