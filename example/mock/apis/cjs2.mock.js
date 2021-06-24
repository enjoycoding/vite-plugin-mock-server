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