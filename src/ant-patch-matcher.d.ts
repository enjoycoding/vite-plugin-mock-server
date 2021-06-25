declare module '@howiefh/ant-path-matcher' {

  export type DoMatchFunction = {
    (pattern: string, path: string, fullMatch: boolean, pathVars?: { [key: string]: string }): boolean
  }

  class AntPathMatcher {
    constructor()
    doMatch: DoMatchFunction
  }

  export default AntPathMatcher
}
