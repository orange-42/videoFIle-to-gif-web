import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import mkcert from 'vite-plugin-mkcert';


// https://vitejs.dev/config/
export default defineConfig({
  // @ts-ignore
  plugins: [vue(), vueJsx(), mkcert()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util']
  },
  base: './',
  server: {
    port: 5000,
    host: '0.0.0.0',
    cors: true,
    https: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'cross-origin-resource-policy': 'cross-origin'
    },
  },
  build: {
    target: 'esnext'
  }
})
