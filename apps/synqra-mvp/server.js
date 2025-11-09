/**
 * ============================================================
 * CUSTOM SERVER FOR RAILWAY DEPLOYMENT
 * ============================================================
 * This custom server ensures proper port binding for Railway
 *
 * Railway provides PORT env var dynamically
 * Falls back to 8080 for local development
 */

const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '8080', 10)

// Initialize Next.js app
const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      // Parse URL
      const parsedUrl = parse(req.url, true)

      // Handle the request
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling request', err)
      res.statusCode = 500
      res.end('Internal server error')
    }
  })
    .once('error', (err) => {
      console.error('Server error:', err)
      process.exit(1)
    })
    .listen(port, hostname, () => {
      console.log(
        `> Server listening at http://${hostname}:${port} as ${
          dev ? 'development' : process.env.NODE_ENV
        }`
      )
      console.log(`> Environment: ${process.env.NODE_ENV || 'development'}`)
      console.log(`> Agent Mode: ${process.env.AGENT_MODE || 'mock'}`)
    })
})
