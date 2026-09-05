import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
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
      'An unexpected error occurred'
    return Promise.reject(new Error(message))
  },
)
