declare module 'cookie-parser' {
  import { Connect } from 'vite'
  function cookieParser(secret?: string | string[], options?: {decode?(val: string): string;}): Connect.NextHandleFunction;
  export default cookieParser;
}