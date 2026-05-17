import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import eslintPlugin from 'vite-plugin-eslint'

const PROD_API = 'https://final-year-project-jy2j.onrender.com';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      eslintPlugin({ emitWarning: false, emitError: false, failOnWarning: false, failOnError: false })
    ],
    define: {
      // Ensure VITE_API_BASE_URL always has a value even if env var is missing
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(env.VITE_API_BASE_URL || PROD_API),
    }
  };
});
