declare module '@howiefh/ant-path-matcher' {
  class AntPathMatcher {
    constructor()
    doMatch(pattern: string, path: string, fullMatch: boolean, pathVars?: { [key: string]: string }): boolean
  }

  export default AntPathMatcher
}
