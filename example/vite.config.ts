import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mockServer from '../src'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    mockServer({
      logLevel: 'info',
      middlewares: [
        cookieParser(),
        bodyParser.json(),
        bodyParser.urlencoded(),
        bodyParser.text(),
        bodyParser.raw()
      ]
    }) as Plugin
  ]
})
