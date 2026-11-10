import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const frontendDirectory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(frontendDirectory, '..')

export default defineConfig({
  root: frontendDirectory,
  envDir: projectRoot,
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/django-api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/django-api/, '/api'),
      },
    },
  },
})
