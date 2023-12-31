import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
//import mockServer from 'vite-plugin-mock-server'
import mockServer from '../dist/index.js'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(), 
    mockServer()
  ],
})
