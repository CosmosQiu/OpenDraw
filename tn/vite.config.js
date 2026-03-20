import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/canvas': {
        target: 'http://localhost:5173',
        changeOrigin: true,
        rewrite: (requestPath) => requestPath.replace(/^\/canvas/, ''),
      },
      '/@vite': {
        target: 'http://localhost:5173',
        changeOrigin: true,
      },
      '/@fs': {
        target: 'http://localhost:5173',
        changeOrigin: true,
      },
      '/src': {
        target: 'http://localhost:5173',
        changeOrigin: true,
      },
      '/node_modules': {
        target: 'http://localhost:5173',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
