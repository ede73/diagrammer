import * as http from 'http'
import * as fs from 'fs'
import * as qs from 'querystring'
import { doCliVisualize } from '../js/clivisualize.js'
import { configSupport } from '../js/configsupport.js'
import * as  url from 'url'

const host = 'localhost'
const port = 8000

//TODO: CORS MIGHT NOT WORK YET FULLY

// old apache2/php interface had:
// - saveExport - for (permanently storing) local storage drawings
// - loadExport - for importing them back to the browser
// - visalize - interface to backend visualizers (running blockdiag, returning PNG)
const cacheControl = () => {
    /*
    #<!-- HTTP 1.1 -->
#<meta http-equiv="Cache-Control" content="no-store"/>
#<!-- HTTP 1.0 -->
#<meta http-equiv="Pragma" content="no-cache"/>
#<!-- Prevents caching at the Proxy Server -->
#<meta http-equiv="Expires" content="0"/>
header("Content-type: image/png"); ==> res.writeHead(200, { 'Content-Type': 'application/json' })
    */
}

function sanitize (ip) {
    return ip.replace(/[:/.]/g, '_')
}

function getSafeIP (req) {
    return sanitize(req.socket.remoteAddress);
}

const readPost = (
     /** @type {http.IncomingMessage} */req,
    done) => {
    var body = ''

    console.log("Setup reading request data...")
    req.on('data', (data) => {
        body += data
        if (body.length > 1e6)
            request.connection.destroy()
    })

    req.on('end', () => {
        done(body)
    })
}

const visualize = (
    /** @type {http.IncomingMessage} */req,
     /**@type {http.ServerResponse}*/res) => {
    const qp = qs.parse(req.url, '?')
    console.log(qp)
    if (!qp?.visualizer) {
        res.writeHead(404)
        res.end()
        return
    }
    readPost(req, (body) => {
        const useConfig = configSupport('miniserver.js', {
            format: 'png',
            visualizer: '',
            visualizedGraph: '-',
            parsedCode: '',
            returnImage: true,
            outputImage: '',
            redirectingDiag: true
        })

        useConfig.visualizer = qp.visualizer
        doCliVisualize(useConfig, body, qp.visualizer, (finished) => {
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Cache-Control': 'public, max-age=1',
                'Access-Control-Allow-Origin': 'http://localhost',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
            })
            //https://adevait.com/nodejs/convert-node-js-buffer-to-string latin1! 
            fs.writeFileSync('/tmp/z.png', useConfig.outputImage, 'latin1')
            res.end(Buffer.from(useConfig.outputImage, 'latin1').toString('base64'))
        })
    })
}

const getContentType = (filename) => {
    if (filename.endsWith('.html')) {
        return 'text/html';
    }
    if (filename.endsWith('.png')) {
        return 'image/png';
    }
    if (filename.endsWith('.css')) {
        return 'text/css';
    }
    if (filename.endsWith('.js')) {
        return 'text/javascript';
    }
    if (filename.endsWith('.svg')) {
        return 'image/svg+xml';
    }
    if (filename.endsWith('.txt')) {
        return 'text/plain';
    }
    return 'text/plain';
}

const serveFile = (
    /** @type {http.IncomingMessage} */req,
     /**@type {http.ServerResponse}*/res) => {
    const query = url.parse(req.url)
    const filename = (query.pathname === '/' ? '/index.html' : query.pathname).substring(1)
    if (fs.existsSync(filename)) {
        const ct = getContentType(filename)
        res.writeHead(200, {
            'Content-Type': ct,
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0',
            'Access-Control-Allow-Origin': 'http://localhost',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        })
        res.end(fs.readFileSync(filename))
        return true
    }
    console.log(`Could not find requested ${JSON.stringify(query)}`)
    return false
}

const loadExport = (
    /** @type {http.IncomingMessage} */req,
     /**@type {http.ServerResponse}*/res) => {
    const filename = `web/exported/localstorage_${getSafeIP(req)}.json`
    let status = 404
    let exported = ''
    if (fs.existsSync(filename)) {
        exported = fs.readFileSync(filename, 'utf8')
        status = 200
    }
    res.writeHead(status, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': 'http://localhost',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
    })
    res.end(exported)
}

const saveExport = (
    /** @type {http.IncomingMessage} */req,
     /**@type {http.ServerResponse}*/res) => {
    readPost(req, (body) => {
        const filename = `web/exported/localstorage_${getSafeIP(req)}.json`
        fs.writeFileSync(filename, body, 'utf8')
        res.writeHead(200, {
            'Access-Control-Allow-Origin': 'http://localhost',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
        })
        res.end()
    })
}

const requestListener = (
    /** @type {http.IncomingMessage} */req,
     /**@type {http.ServerResponse}*/res) => {
    console.error(`MITA ${req.url} ${req.method}`)
    switch (req.method) {
        case 'OPTIONS':
            // related to CORS
            // vary per request!
            res.writeHead(200, {
                'Access-Control-Allow-Origin': 'http://localhost',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'access-control-allow-origin, content-type'
            })
            res.end('')
            return
        case 'POST':

            if (req.url.startsWith('/visualize')) {
                return visualize(req, res)
            } else if (req.url.startsWith('/saveExport')) {
                return saveExport(req, res)
            }
        case 'GET':
            if (req.url.startsWith('/loadExport')) {
                return loadExport(req, res)
            } else if (serveFile(req, res)) {
                return
            }
    }
    console.error(`Unknown request ${req.url} ${req.method}`)
    res.writeHead(405, "Not found")
    res.end(`Not found (${req.url})`)
}

const server = http.createServer(requestListener)
server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`)
})
