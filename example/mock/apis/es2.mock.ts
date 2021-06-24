import { MockHandler } from '../../../src'

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
      res.end('Hello world!' + req.url)
    }
  }
]
