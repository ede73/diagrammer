#!/usr/bin/env node

import * as http from 'http'
import * as fs from 'fs'
import * as qs from 'querystring'
import { doCliVisualize } from '../js/clivisualize.js'
import { configSupport } from '../js/configsupport.js'
import * as url from 'url'
import { type VisualizeConfigType } from '../js/visualizeConfigType.js'

const maybePort = process.argv[2]

const host = 'localhost'
// TODO: Would love to make configurable,  (see setup.sh) tests web/backend.. web/visualize
const port = maybePort ? Number(maybePort) : 8000

// TODO: CORS MIGHT NOT WORK YET FULLY

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

interface MiniServerConfigType extends VisualizeConfigType {
  parsedCode: string
}

const visualize = (
  req: http.IncomingMessage,
  res: http.ServerResponse) => {
  const qp = qs.parse(req.url as string, '?')
  if (!qp?.visualizer) {
    res.writeHead(404)
    res.end()
    return
  }
  readPost(req, (body) => {
    const useConfig = configSupport<MiniServerConfigType>('miniserver.js', {
      format: 'png',
      visualizer: '',
      visualizedGraph: '-',
      parsedCode: '',
      returnImage: true,
      outputImage: '',
      redirectingDiag: true
    })

    useConfig.visualizer = qp.visualizer as string
    doCliVisualize(useConfig, body, qp.visualizer as string, (finished) => {
      res.writeHead(200, {
        'Content-Type': 'image/png',
        ...cacheControl(),
        ...corsHeaders()
      }).end(
        Buffer.from(useConfig.outputImage, 'latin1').toString('base64')
      )
      // // https://adevait.com/nodejs/convert-node-js-buffer-to-string latin1!
      // fs.writeFileSync('/tmp/z.png', useConfig.outputImage, 'latin1')
    }).catch(err => { console.error(err) })
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
  // suggests to use url.URL but that cannot parse relative URLs (or URIs)
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
  /** @type {http.IncomingMessage} */req,
  /** @type {http.ServerResponse} */res) => {
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
      // related to CORS
      // vary per request!
      res.writeHead(200, {
        ...corsHeaders(),
        'Access-Control-Allow-Headers': 'access-control-allow-origin, content-type'
      }).end()
      return
    case 'POST':

      if (req.url?.startsWith('/visualize')) {
        visualize(req, res); return
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
