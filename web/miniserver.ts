#!/usr/bin/env node

import * as http from 'http'
import * as fs from 'fs'
import * as qs from 'querystring'
import * as url from 'url'
import * as path from 'path'
import * as os from 'os'
import { execFileSync } from 'child_process'

const maybePort = process.argv[2]

const host = 'localhost'
const port = maybePort ? Number(maybePort) : 8000

const cacheControl = () => {
  return {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    Pragma: 'no-cache',
    Expires: '0'
  }
}

const corsHeaders = () => {
  return {
    'Access-Control-Allow-Origin': 'http://localhost',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  }
}

function sanitize(ip: string) {
  return ip.replace(/[:/.]/g, '_')
}

function getSafeIP(req: http.IncomingMessage) {
  return sanitize(req.socket.remoteAddress as string)
}

const readPost = (
  req: http.IncomingMessage,
  done: (body: string) => void) => {
  let body = ''
  req.on('data', (data: string) => {
    body += data
    if (body.length > 1e6) { req.connection.destroy() }
  })

  req.on('end', () => {
    done(body)
  })
}

function getDiagrammerBin(): string {
  if (fs.existsSync('./diagrammer')) return './diagrammer'
  if (fs.existsSync('./target/release/diagrammer')) return './target/release/diagrammer'
  if (fs.existsSync('../target/release/diagrammer')) return '../target/release/diagrammer'
  return 'diagrammer'
}

const visualize = (
  req: http.IncomingMessage,
  res: http.ServerResponse) => {
  const qp = qs.parse(req.url?.split('?')[1] ?? '')
  const visualizer = qp?.visualizer as string
  if (!visualizer) {
    res.writeHead(404)
    res.end()
    return
  }
  readPost(req, (body) => {
    const tmpPng = path.join(os.tmpdir(), `diagrammer_${Date.now()}_${Math.random().toString(36).substring(7)}.png`)
    try {
      const bin = getDiagrammerBin()
      execFileSync(bin, [visualizer, '-Tpng', '-o', tmpPng], { input: body })
      const pngBuf = fs.readFileSync(tmpPng)
      try { fs.unlinkSync(tmpPng) } catch (_) {}
      res.writeHead(200, {
        'Content-Type': 'image/png',
        ...cacheControl(),
        ...corsHeaders()
      }).end(pngBuf.toString('base64'))
    } catch (err: any) {
      try { if (fs.existsSync(tmpPng)) fs.unlinkSync(tmpPng) } catch (_) {}
      console.error('Visualization error:', err)
      res.writeHead(500, {
        'Content-Type': 'text/plain; charset=utf-8',
        ...cacheControl(),
        ...corsHeaders()
      }).end(String(err))
    }
  })
}

const parseEndpoint = (req: http.IncomingMessage, res: http.ServerResponse) => {
  const qp = qs.parse(req.url?.split('?')[1] ?? '')
  const visualizer = (qp.visualizer as string) || 'dot'
  readPost(req, (body) => {
    try {
      const bin = getDiagrammerBin()
      const output = execFileSync(bin, [visualizer], { input: body, encoding: 'utf-8' })
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        ...cacheControl(),
        ...corsHeaders()
      }).end(output)
    } catch (e: any) {
      res.writeHead(500, {
        'Content-Type': 'text/plain; charset=utf-8',
        ...cacheControl(),
        ...corsHeaders()
      }).end(String(e))
    }
  })
}

const getContentType = (filename: string) => {
  if (filename.endsWith('.html')) {
    return 'text/html'
  }
  if (filename.endsWith('.png')) {
    return 'image/png'
  }
  if (filename.endsWith('.css')) {
    return 'text/css'
  }
  if (filename.endsWith('.js')) {
    return 'text/javascript'
  }
  if (filename.endsWith('.wasm')) {
    return 'application/wasm'
  }
  if (filename.endsWith('.svg')) {
    return 'image/svg+xml'
  }
  if (filename.endsWith('.txt')) {
    return 'text/plain'
  }
  return 'text/plain'
}

const serveFile = (
  req: http.IncomingMessage,
  res: http.ServerResponse) => {
  // eslint-disable-next-line n/no-deprecated-api
  const query = url.parse(req.url ?? '')
  const filename = (query.pathname === '/' ? '/index.html' : query.pathname ?? '/index.html').substring(1)
  if (fs.existsSync(filename)) {
    const ct = getContentType(filename)
    res.writeHead(200, {
      'Content-Type': ct,
      ...cacheControl(),
      ...corsHeaders()
    }).end(fs.readFileSync(filename))
    return true
  }
  console.warn(`Could not find requested ${JSON.stringify(query)}`)
  return false
}

const loadExport = (
  req: http.IncomingMessage,
  res: http.ServerResponse) => {
  const filename = `web/exported/localstorage_${getSafeIP(req)}.json`
  let status = 404
  let exported = ''
  if (fs.existsSync(filename)) {
    exported = fs.readFileSync(filename, 'utf8')
    status = 200
  }
  res.writeHead(status, {
    'Content-Type': 'application/json',
    ...cacheControl(),
    ...corsHeaders()
  }).end(exported)
}

const saveExport = (
  req: http.IncomingMessage,
  res: http.ServerResponse) => {
  readPost(req, (body) => {
    const filename = `web/exported/localstorage_${getSafeIP(req)}.json`
    fs.writeFileSync(filename, body, 'utf8')
    res.writeHead(200, {
      ...corsHeaders()
    }).end()
  })
}

const requestListener = (
  req: http.IncomingMessage,
  res: http.ServerResponse) => {
  switch (req.method) {
    case 'OPTIONS':
      res.writeHead(200, {
        ...corsHeaders(),
        'Access-Control-Allow-Headers': 'access-control-allow-origin, content-type'
      }).end()
      return
    case 'POST':
      if (req.url?.startsWith('/visualize')) {
        visualize(req, res); return
      } else if (req.url?.startsWith('/parse')) {
        parseEndpoint(req, res); return
      } else if (req.url?.startsWith('/saveExport')) {
        saveExport(req, res); return
      }
      break
    case 'GET':
      if (req.url?.startsWith('/loadExport')) {
        loadExport(req, res); return
      } else if (serveFile(req, res)) {
        return
      }
  }
  console.error(`Unknown request ${req.url ?? ''} ${req.method ?? ''}`)
  res.writeHead(405, 'Not found').end(`Not found (${req.url ?? ''})`)
}

const server = http.createServer(requestListener)
server.listen(port, host, () => {
  console.warn(`Server is running on http://${host}:${port}`)
})
