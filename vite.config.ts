import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import svgr from 'vite-plugin-svgr'

const DEFAULT_BASE_URL = '/'

const BASE_URL_MAP = {
  development: DEFAULT_BASE_URL,
  production: process.env.BASE_URL ?? DEFAULT_BASE_URL
}

// https://vitejs.dev/config/
export default defineConfig((env) => ({
  base: BASE_URL_MAP[env.mode],
  plugins: [react(), svgr()],
  server: {
    port: 5174
  }
}))
