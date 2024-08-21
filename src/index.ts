import { Plugin, ViteDevServer, Connect } from 'vite'
import * as http from 'http'
import AntPathMatcher from '@howiefh/ant-path-matcher'
import chokidar from 'chokidar'
import path from 'path'
import fs from 'fs'
import { build } from 'esbuild'

const PLUGIN_NAME = 'vite-plugin-mock-server'
const TEMPORARY_FILE_SUFFIX = '.tmp.cjs'
let LOG_LEVEL = 'error'
const requireCache = new Map<string, any>()

type Request = Connect.IncomingMessage & { 
  body?: any, 
  params?: { [key: string]: string }, 
  query?: { [key: string]: string },
  cookies?: { [key: string]: string },
  session?: any
}

export type MockFunction = {
  (
    req: Request, 
    res: http.ServerResponse, 
    /** @deprecated in 2.0, use req.params **/
    urlVars?: { [key: string]: string }
  ): void
}

export type MockLayer = (
    req: Request,
    res: http.ServerResponse,
    next: Connect.NextFunction
) => void;

export type MockHandler = {
  pattern: string,
  method?: string,
  handle: MockFunction
}

export type MockOptions = {
  logLevel?: 'info' | 'error' | 'off'
  urlPrefixes?: string[]
  mockJsSuffix?: string
  mockTsSuffix?: string
  mockRootDir?: string
  mockModules?: string[]
  noHandlerResponse404?: boolean
  middlewares?: MockLayer[]
  printStartupLog?: boolean
}

export default (options?: MockOptions): Plugin => {

  return {
    name: PLUGIN_NAME,
    configureServer: async (server: ViteDevServer) => {
      // build url matcher
      const matcher = new AntPathMatcher()
      // init options
      options = options || {}
      options.logLevel = options.logLevel || 'error'
      options.urlPrefixes = options.urlPrefixes || ['/api/']
      options.mockRootDir = options.mockRootDir || './mock'
      options.mockJsSuffix = options.mockJsSuffix || '.mock.js'
      options.mockTsSuffix = options.mockTsSuffix || '.mock.ts'
      options.noHandlerResponse404 = (typeof options.noHandlerResponse404 !== "undefined") ? !!options.noHandlerResponse404 : true;
      options.printStartupLog = (typeof options.printStartupLog !== "undefined") ? !!options.printStartupLog : true;
      if (options.mockModules && options.mockModules.length > 0) {
        console.warn('[' + PLUGIN_NAME + '] mock modules will be set automatically, and the configuration will be ignored', options.mockModules)
      }
      options.mockModules = []
      LOG_LEVEL = options.logLevel
      // watch mock files
      watchMockFiles(options).then(() => {
        if (options.printStartupLog) {
          console.log('[' + PLUGIN_NAME + '] mock server started. options =', options)
        }
      })
      if (options.middlewares) {
        for (const [, layer] of options.middlewares.entries()) {
          server.middlewares.use((req, res, next) => {
            const hasMatch = options.urlPrefixes.some((prefix) => req.url.startsWith(prefix))
            if (hasMatch) {
              layer(req, res, next)
            } else {
              next()
            }
          });
        }
      }
      server.middlewares.use((
        req: Connect.IncomingMessage,
        res: http.ServerResponse,
        next: Connect.NextFunction
      ) => {
        doHandle(options, matcher, req, res, next)
      })
    }
  }
}

async function importCache(modName: string) {
  const mod = await import('file://' + modName)
  let module
  if (mod.default && mod.default.default)
    module = mod.default
  else 
    module = mod

  requireCache.set(modName, module)
  return module
}

const doHandle = async (
  options: MockOptions,
  matcher: AntPathMatcher,
  req: Request,
  res: http.ServerResponse,
  next: Connect.NextFunction
) => {
  for (const [, prefix] of options.urlPrefixes.entries()) {
    if (!req.url.startsWith(prefix)) continue
    for (const [, modName] of options.mockModules.entries()) {
      const module = requireCache.get(modName)
      
      if (!module) {
        continue
      }
      let handlers: MockHandler[]
      if (modName.endsWith(TEMPORARY_FILE_SUFFIX)) {
        const exports = module.default
        logInfo('typeof exports', typeof exports)
        if (typeof exports === 'function') {
          handlers = exports()
        } else {
          handlers = exports
        }
      } else {
        handlers = module.default
      }

      for (const [, handler] of handlers.entries()) {
        const [path, qs] = req.url.split('?')
        const pathVars: { [key: string]: string } = {};
        let matched = matcher.doMatch(handler.pattern, path, true, pathVars)
        if (matched && handler.method) {
          matched = handler.method === req.method
        }

        if (matched) {
          logInfo('matched and call mock handler', handler, 'pathVars', pathVars)
          req.params = pathVars;
          req.query = parseQueryString(qs);
          handler.handle(req, res, { ...pathVars })
          return
        }
      }
    }
    if (options.noHandlerResponse404) {
      res.statusCode = 404
      const { url, method } = req
      res.end('[' + PLUGIN_NAME + '] no handler found, { url: "' + url + '", method: "' + method + '" }')
      return
    }
  }
  next()
}

const watchMockFiles = async (options: MockOptions) => {
  const watchDir = path.resolve(process.cwd(), options.mockRootDir)
  logInfo('watched root dir is', watchDir)
  await loadMockModules(options, watchDir)
  chokidar.watch(watchDir, {
    ignoreInitial: true,
  }).on('all', async (event, path) => {
    if (path.endsWith(TEMPORARY_FILE_SUFFIX)) return
    logInfo('event', event, 'path', path)
    if (event === 'addDir') return
    if (event === 'unlinkDir') {
      for (const modName of [...requireCache.keys()]) {
        if (modName.startsWith(watchDir)) {
          await deleteMockModule(options, modName)
        }
      }
      await loadMockModules(options, watchDir)
      return
    }
    if (!path.endsWith(options.mockJsSuffix) && !path.endsWith(options.mockTsSuffix)) return
    if (event === 'add' || event === 'change') {
      await loadMockModule(options, path)
    } else if (event === 'unlink') {
      await deleteMockModule(options, path)
    }
  })
}

const loadMockModules = async (options: MockOptions, watchDir: string) => {
  logInfo('recursive loading mock modules', watchDir)
  for (const [, name] of fs.readdirSync(watchDir).entries()) {
    const modName = path.join(watchDir, name)
    const stat = fs.statSync(modName)
    if (stat.isDirectory()) {
      loadMockModules(options, modName)
      continue
    }
    if (!stat.isFile()) return
    await loadMockModule(options, modName)
  }
}

const loadMockModule = async (options: MockOptions, moduleName: string) => {
  logInfo('loading mock module', moduleName)
  if (moduleName.endsWith(options.mockJsSuffix)) {
    await loadJsMockModule(options, moduleName)
  } else if (moduleName.endsWith(options.mockTsSuffix)) {
    await loadTsMockModule(options, moduleName)
  }
}

const loadJsMockModule = async (options: MockOptions, moduleName: string, skipCheck?: boolean) => {
  if (!skipCheck) {
    if (!moduleName.endsWith(options.mockJsSuffix)) return
    if (!fs.statSync(moduleName).isFile()) return
  }
  await deleteMockModule(options, moduleName)
  logInfo('loading js mock module', moduleName)
  const handlers = await importCache(moduleName)
  if (!moduleName.endsWith(TEMPORARY_FILE_SUFFIX)) {
    logInfo('loaded mock handlers', handlers)
  }
  if (typeof handlers.default === 'function') {
    logInfo('loaded mock handlers', handlers.default())
  } else {
    logInfo('loaded mock handlers', handlers.default)
  }
  options.mockModules.push(moduleName)
}

const loadTsMockModule = async (options: MockOptions, moduleName: string) => {
  if (!moduleName.endsWith(options.mockTsSuffix)) return
  if (!fs.statSync(moduleName).isFile()) return
  logInfo('loading ts mock module', moduleName)
  const result = await build({
    entryPoints: [moduleName],
    outfile: 'out.js',
    write: false,
    platform: 'node',
    bundle: true,
    format: 'cjs',
    metafile: true,
    target: 'es2015',
  })
  const { text } = result.outputFiles[0]
  const modName = moduleName + TEMPORARY_FILE_SUFFIX
  fs.writeFileSync(modName, text)
  await loadJsMockModule(options, modName, true)
  fs.unlink(modName, (err) => {
    if (err) logErr('delete file ' + modName + ' error', err)
  })
}

const deleteMockModule = async (options: MockOptions, moduleName: string) => {
  logInfo('delete module cache', moduleName)
  requireCache.delete(moduleName)
  for (const [i, modName] of options.mockModules.entries()) {
    if (modName === moduleName) {
      options.mockModules.splice(i, 1)
    }
  }
}

const logInfo = (...optionalParams: any[]) => {
  if (LOG_LEVEL !== 'info') return
  console.info('[vite-plugin-mock-server]', optionalParams)
}

const parseQueryString = (qs: string): { [key: string]: string } => !qs ? {} : decodeURI(qs)
    .split('&')
    .map(param => param.split('='))
    .reduce((values: { [key: string]: string }, [key, value]) => {
      values[key] = value;
      return values;
    }, {})

const logErr = (...optionalParams: any[]) => {
  if (LOG_LEVEL === 'off') return
  console.error('[vite-plugin-mock-server]', optionalParams)
}
