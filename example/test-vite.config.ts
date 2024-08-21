import { defineConfig, Plugin } from 'vite'
import vue from '@vitejs/plugin-vue'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mockServer from '../src'
import fetch from 'node-fetch-commonjs'

const port = 8000
export default defineConfig({
  server: { port },
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
    }) as Plugin,
    {
      name: `vite-plugin-stop`,
      apply: 'serve',
      configureServer(server) {
        setTimeout(async ()=> {
          const resp = await fetch(`http://127.0.0.1:${port}/api/test1/1`)
          const responseText = await resp.text()

          const resp2 = await fetch(`http:/127.0.0.1:${port}/api/test1/users/octoape`)
          const responseJson: any = await resp2.json()

          const userId = responseJson.params.userId
          
          server.close()
          if(responseText !== 'Hello world!/api/test1/1' || userId !== "octoape") 
            throw new Error('wrong mock response')
          else 
            console.log('\x1b[32m ✓ correct mock response \x1b[0m');
        
          setTimeout(process.exit, 1e3)
        }
        , 3000)
      }
    }
  ]
})
