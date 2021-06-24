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