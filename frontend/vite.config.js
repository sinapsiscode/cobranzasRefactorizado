import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3333,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8231',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: { alias: { '@': '/src' } }
})