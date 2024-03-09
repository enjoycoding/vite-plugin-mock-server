# vite-plugin-mock-server

[![npm][npm-img]][npm-url]

Provide local mocks for [Vite].

A mock server plugin for [Vite], developed based on TypeScript. 
And support using TypeScript and JavaScript to write Mock API. When the Mock API file 
is modified, it will be hot updated automatically. Support and compatibility 
with ***[express.js](https://github.com/expressjs/)*** middlewares.

## Install

**node version:** >=12.0.0

**vite version:** >=2.0.0

```bash
# if using npm
npm i vite-plugin-mock-server -D
# if using yarn
yarn add vite-plugin-mock-server -D
```

### Run example

```bash
cd ./example
npm install
npm run dev
```

## Usage

- Config plugin in vite.config.ts, compatible with express.js middlewares.

```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import bodyParser from 'body-parser'
import cookieParser from 'cookie-parser'
import mockServer from 'vite-plugin-mock-server'

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
    })
  ]
})
```

- Or just use it with the default parameters, place your mocks in the folder "mock" with name that prefix *.mock.ts or *mock.js, The default api to mock is '/api/'
```ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import mockServer from 'vite-plugin-mock-server'

export default defineConfig({
  plugins: [
    vue(),
    mockServer())
  ]
})
```

## Module exports

- MockOptions

`mockModules` Ignore manual configuration, it will be filled in automatically.

```ts
export type MockOptions = {
  logLevel?: 'info' | 'error' | 'off'
  urlPrefixes?: string[]
  mockJsSuffix?: string
  mockTsSuffix?: string
  mockRootDir?: string
  mockModules?: string[]
  noHandlerResponse404?: boolean
  middlewares?: MockLayer[]
}

// default options
const options: MockOptions = {
  logLevel: 'info',
  urlPrefixes: [ '/api/' ],
  mockRootDir: './mock',
  mockJsSuffix: '.mock.js',
  mockTsSuffix: '.mock.ts',
  noHandlerResponse404: true,
  mockModules: [],
  middlewares: [] 
}
```

- Request
  
```ts
type Request = Connect.IncomingMessage & { 
  body?: any, 
  params?: { [key: string]: string }, 
  query?: { [key: string]: string },
  cookies?: { [key: string]: string },
  session?: any
}
```

- MockFunction
  
```ts
export type MockFunction = {
  (
    req: Request, 
    res: http.ServerResponse, 
    /** @deprecated in 2.0, use req.params **/
    urlVars?: { [key: string]: string }
  ): void
}
```

- MockHandler

```ts
export type MockHandler = {
  pattern: string,
  method?: string,
  handle: MockFunction
}
```

- MockLayer

```ts
export type MockLayer = (
    req: Request,
    res: http.ServerResponse,
    next: Connect.NextFunction
) => void;
```

## Mock file examples

The `pattern` is an ant-style path pattern string, 
use ***[@howiefh/ant-path-matcher](https://www.npmjs.com/package/@howiefh/ant-path-matcher)*** 
to match the `pattern` and `request URL`.

```ts
// example/mock/es.mock.ts

import { MockHandler } from '../../src'

const mocks: MockHandler[] = [
  {
    pattern: '/api/test1/1',
    handle: (req, res) => {
      res.end('Hello world!' + req.url)
    }
  },
  {
    pattern: '/api/test1/*',
    handle: (req, res) => {
      res.end('Hello world!' + req.url)
    }
  },
  {
    pattern: '/api/test1/users/{userId}',
    handle: (req, res) => {
      const data = {
        url: req.url,
        params: req.params,
        query: req.query,
        body: req.body
      }
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data))
    }
  },
  {
    pattern: '/api/test1/body/json',
    method: 'POST',
    handle: (req, res) => {
      res.setHeader('Content-Type', 'application/json')

      //req is incomingMessage which extends stream.Readable 
      // --> https://nodejs.org/api/stream.html#readablereadsize
      // res.end need to be within the function
      // there is a size limit for the bodyString to get parsed 
      req.on('data', (bodyString: string) => { 
        let body: object = JSON.parse(bodyString)
        res.end(JSON.stringify(body))
      })
    }
  },
]

export default mocks

// example/mock/apis/es2.mock.ts

import { MockHandler } from 'vite-plugin-mock-server'

export default (): MockHandler[] => [
  {
    pattern: '/api/test2/1',
    handle: (req, res) => {
      res.end('Hello world!' + req.url)
    }
  },
  {
    pattern: '/api/test2/2',
    handle: (req, res) => {
      res.statusCode = 203
      res.end('Hello world!' + req.url)
    }
  }
]
```

```js
// example/mock/cjs.mock.js

module.exports = [
  {
    pattern: '/api/merchant1',
    method: 'GET',
    handle: (req, res) => {
      res.end('merchant1:' + req.url)
    }
  },
  {
    pattern: '/api/merchant2',
    method: 'GET',
    handle: (req, res) => {
      res.end('merchant2:' + req.url)
    }
  },
  {
    pattern: '/api/merchant2',
    method: 'GET',
    handle: (req, res) => {
      res.end('merchant3:' + req.url)
    }
  }
]

// example/mock/apis/cjs2.mock.js

module.exports = [
  {
    pattern: '/api/hello1',
    method: 'GET',
    handle: (req, res) => {
      res.end('hello1:' + req.url)
    }
  },
  {
    pattern: '/api/hello2',
    method: 'GET',
    handle: (req, res) => {
      res.end('hello2:' + req.url)
    }
  },
  {
    pattern: '/api/hello3',
    method: 'GET',
    handle: (req, res) => {
      res.end('hello2:' + req.url)
    }
  }
]
```

## License

MIT

[npm-img]: https://img.shields.io/npm/v/vite-plugin-mock-server.svg
[npm-url]: https://npmjs.com/package/vite-plugin-mock-server
[Vite]: https://vitejs.dev