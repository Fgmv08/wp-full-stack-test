import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: true,
    allowedHosts: true,
    cors: true,
    proxy: {
      // Reenvía /api/* al backend local en desarrollo.
      // Al usar ruta relativa (/api) en el frontend, este proxy corre en la PC
      // y funciona tanto desde localhost como desde el teléfono en la misma Wi-Fi.
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        // ws: true,  // descomentar si se añaden WebSockets
      },
    },
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
