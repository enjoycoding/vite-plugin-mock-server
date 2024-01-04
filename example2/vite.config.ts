import { ConfigEnv, defineConfig, Plugin, UserConfigExport } from 'vite'
import vue from '@vitejs/plugin-vue'
//import mockServer from 'vite-plugin-mock-server'
import mockServer from '../dist'

export default ({ command, mode }: ConfigEnv): UserConfigExport => {

  if(mode === 'test')
    return {
      plugins: [
        vue(), 
        mockServer(),
        VitePluginRestart()
    ]}
  else 
    return {
      plugins: [
        vue(), 
        mockServer()
    ]}
}

function VitePluginRestart(options = {delay: 5000}): Plugin {
  const {delay} = options

  return {
    name: `vite-plugin-stop`,
    apply: 'serve',
    configureServer(server) {
      setTimeout(()=> {
        server.close()
        setTimeout(process.exit, 1e3)
      }
        , delay)
    },
  }
}