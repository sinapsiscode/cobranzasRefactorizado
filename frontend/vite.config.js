import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3333,
    host: true
    // Proxy deshabilitado - frontend hace peticiones directas al puerto 8231
    // Si hay problemas de CORS, verifica que el backend tenga CORS habilitado
  },
  resolve: { alias: { '@': '/src' } }
})