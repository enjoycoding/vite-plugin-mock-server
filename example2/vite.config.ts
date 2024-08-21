import { ConfigEnv, Plugin, UserConfigExport } from 'vite'
import vue from '@vitejs/plugin-vue'
import fetch from 'node-fetch'
import mockServer from '../src'

const port = 8000
export default ({ command, mode }: ConfigEnv): UserConfigExport => {
  if(mode !== 'test') {
    return {
      plugins: [
        vue(), 
        mockServer() as Plugin
    ]}
  } else {
    // auto close after 5 secounds, to the runtime
    return {
      server: {
        port,
      },
      plugins: [
        vue(), 
        mockServer() as Plugin,
        {
          name: `vite-plugin-stop`,
          apply: 'serve',
          configureServer(server) {
            setTimeout(async ()=> {
              const resp = await fetch(`http://localhost:${port}/api/test1/1`)
              const responseText = await resp.text()
              server.close()
              if(responseText !== 'Hello world!/api/test1/1') 
                throw new Error('wrong mock response')
              else 
                console.log('\x1b[32m ✓ correct mock response \x1b[0m');

              setTimeout(process.exit, 1e3)
            }
            , 5000)
          }
        }
      ]
    }
  }
}
