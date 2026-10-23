import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      // Локальный dev: /api/* → localhost:5000 (локальный backend)
      '/api': 'http://localhost:5000',
    },
  },
})