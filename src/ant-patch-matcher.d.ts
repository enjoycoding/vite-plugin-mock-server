declare module 'ant-path-matcher' {

  export type MatchFunction = {
    (pattern: string, path: string): boolean
  }

  class AntPathMatcher {
    constructor()
    match: MatchFunction
  }

  export default AntPathMatcher
}
