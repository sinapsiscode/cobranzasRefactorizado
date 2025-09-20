import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 3042, host: true },
  resolve: { alias: { '@': '/src' } }
})