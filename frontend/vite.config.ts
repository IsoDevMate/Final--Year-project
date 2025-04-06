import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import eslintPlugin from 'vite-plugin-eslint'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    eslintPlugin({
      emitWarning: false,
      emitError: false,
      failOnWarning: false,
      failOnError: false
    })
  ],
})
