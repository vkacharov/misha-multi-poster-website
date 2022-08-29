import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import mkcert from'vite-plugin-mkcert'
import VitePluginHtmlEnv from 'vite-plugin-html-env'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    https: true
  },
  plugins: [vue(), mkcert(), VitePluginHtmlEnv()]
})
