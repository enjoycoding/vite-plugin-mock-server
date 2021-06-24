import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import mockServer from '../src'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    mockServer({
      logLevel: 'info'
    })
  ]
})
