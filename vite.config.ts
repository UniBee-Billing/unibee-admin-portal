import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { dynamicBase } from 'vite-plugin-dynamic-base'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig((env) => ({
  base: env.mode === 'production' ? '/__dynamic_base__/' : '/',
  plugins: [
    react(),
    svgr({ svgrOptions: { icon: true } }),
    dynamicBase({
      // dynamic public path var string, default window.__dynamic_base__
      publicPath: 'window.__dynamic_base__',
      // dynamic load resources on index.html, default false. maybe change default true
      transformIndexHtml: true
      // provide conversion configuration parameters. by 1.1.0
      // transformIndexHtmlConfig: { insertBodyAfter: false }
    })
  ],
  server: {
    port: 5174
  }
}))
