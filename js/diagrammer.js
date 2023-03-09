import * as lexer from '../build/diagrammer_lexer.js'
import { GraphCanvas, generators, visualizations } from '../model/graphcanvas.js'
import * as fs from 'fs'
import { spawn } from 'child_process'
import path from 'path'
// required to populate generators/visualizations
// eslint-disable-next-line no-unused-vars
import { diagrammerParser } from '../build/diagrammer_parser.js'
import puppeteer from 'puppeteer'
import { singleElementScreenSnapshot } from '../tests/web/snapshot_single_element.js'
import {
  clearGeneratorResults, clearParsingErrors, getParsingError,
  selectGeneratorVisualizer, setDiagrammerCode, waitForGeneratorResults, waitUntilGraphDrawn
} from '../tests/web/diagrammer_support.js'

export function doParse (
  config,
  /** @type {string} */diagrammerCode,
  /** @type {string} */generator,
  /** @type {[(resultLine:string)=>void]} */resultCallback,
  /** @type {[(parseError:string, hash:string)=>void]} */parseErrorCallback,
  /** @type {[(msg:string)=>void]} */traceCallback) {
  if (!diagrammerCode.trim()) {
    config.tp.throwError('No code to parser')
  }
  diagrammerParser.yy.USE_GENERATOR = generator
  diagrammerParser.yy.trace = traceCallback || ((msg) => {})

  diagrammerParser.yy.result = resultCallback || ((result) => {
    // default callback unless overridden
    config.parsedCode += `${result}\n`
    // eslint-disable-next-line no-console
    console.log(result) // ok
  })

  // {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
  // parseError() in (generated) lexer, calls this.yy.parser.parseError() if available
  // TODO: MOVING TO GraphCanvas
  diagrammerParser.yy.parseError = parseErrorCallback || ((str, hash) => {
    config.tp(`Parse error: ${str}`)
    config.throwError(str)
  })
  diagrammerParser.yy.GRAPHCANVAS = new GraphCanvas()
  try {
    diagrammerParser.parse(diagrammerCode)
  } catch (ex) {
    // wow, something went down
    diagrammerParser.yy.parseError(String(ex), 'Caught Exception')
  }
}

export function doLex (
  config,
  /** @type {string} */diagrammerCode,
  /** @type {(token:string,codePart:any)=>void} */resultsCallback) {
  if (!diagrammerCode.trim()) {
    config.tp.throwError('No code to lexer')
  }
  config.tp('Begin lex testing')
  const st = lexer.diagrammerLexer
  st.setInput(diagrammerCode)
  let h
  while (h !== 'EOF' && h !== 1) {
    try {
      h = st.lex()
    } catch (ex) {
      config.tp(`${ex}`)
      throw ex
    }
    if (resultsCallback) {
      resultsCallback(h, st)
    }
  }
}

// just a test code
async function _sshot (page) {
  const options = {
    path: 'sshot.png',
    fullPage: false,
    clip: {
      x: 0,
      y: 0,
      width: 1024,
      height: 800
    }
  }
  await page.screenshot(options)
}

async function _webRender (useConfig, visualizer, code, outputShot) {
  useConfig.tp(`Web render using ${visualizer} saving output to ${outputShot}`)
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.goto('http://localhost/~ede/diagrammer/?do_not_load_initial_example=1')
  await page.setViewport({ width: 1024, height: 800 })

  await selectGeneratorVisualizer(page, visualizer)
  await waitUntilGraphDrawn(page)
  await clearParsingErrors(page)
  await clearGeneratorResults(page)
  await setDiagrammerCode(page, code)
  await waitForGeneratorResults(page)

  // TODO: D3.js ends up with div#graph../[div#default_,svg] GoJs div#graph../div#default_/svg
  const selector = (await page.$('#diagrammer-graph>svg') != null) ? '#diagrammer-graph>svg' : '#diagrammer-graph>div>svg'
  const elementHandle = await page.$(selector)

  const error = await getParsingError(page)
  if (error.trim()) {
    useConfig.throwError(error)
  }
  if (!elementHandle) {
    await _sshot(page)
    useConfig.throwError(`Could not find element ${selector}`)
  }
  // BBox, getBoundingClientRect
  const bbox = await elementHandle.boundingBox()
  const svg = await page.evaluate((selector) => document.querySelector(selector).outerHTML, selector)
  if (!svg) {
    useConfig.throwError('Could not get SVG code')
  }
  const buffer = await singleElementScreenSnapshot(browser, svg, bbox?.width, bbox?.height)

  if (useConfig.isPipeMarker(outputShot)) {
    // TODO: yeah..doesnt work
    process.stdout.write(buffer)
  } else {
    const x = fs.createWriteStream(outputShot, { flags: 'w', autoClose: true })
    x.write(buffer)
    x.end()
  }
  await browser.close()
}

function _startVisualizer (useConfig, fd, args, gotStdout, gotStdErr) {
  useConfig.tp(`Start visualizer ${args}`)
  const options = { stdio: ['pipe', fd || 'pipe', 'pipe'], shell: true }
  const cmd = args[0]
  const a = args.splice(1)
  useConfig.tp(`spawn ${cmd} with ${a} options ${JSON.stringify(options)}`)
  const proc = spawn(cmd, a, options)
  const v = _prepProcess(proc, gotStdout, gotStdErr)
  v.title = 'VISUALIZER'
  return v
}

// TODO: read dynamically
export function _getWebVisualizers () {
  return ['dendrogram:circlepacked', 'dendrogram:radialdendrogram', 'dendrogram:reingoldtilford',
    'digraph:circo', 'digraph:dot', 'digraph:fdp', 'digraph:neato', 'digraph:osage',
    'digraph:sfdp', 'digraph:twopi', 'layerbands', 'parsetree', 'sankey', 'umlclass']
}

function _isHackyWebVisualizer (config, overrideVisualizer) {
  // TODO: test runner support pending
  if (config.tests) {
    return false
  }
  const searchVisualizer = overrideVisualizer || config.visualizer
  return _getWebVisualizers().includes(searchVisualizer)
}

const _waitForProcesses = (useConfig, processes) => {
  return new Promise((resolve, reject) => {
    let completed = 0

    const onExit = (process) => () => {
      useConfig.tp(`  (Process ${process.title} exited with ${process.exitCode})`)
      completed++
      if (completed === processes.length) {
        resolve()
      }
    }

    processes.forEach((process) => {
      process.on('exit', onExit(process))
      process.on('error', (r) => {
        useConfig.printError(`Something went wrong with ${process.title} - ${r}`)
        useConfig.dumpTraces()
        reject(r)
      })
    })
  })
}

function _getVisualizerCommand (useConfig) {
  const plantUmlJar = 'ext/plantuml.jar'

  switch (useConfig.visualizer) {
    case 'nwdiag':
    case 'seqdiag':
    case 'actdiag':
    case 'blockdiag':
      if (useConfig.format !== 'svg') {
        useConfig.buggyDiag = true
      }
      if (!useConfig.buggyDiag) {
        // heh, it's still buggy, but we can circumvent
        return [
          // piping works if running as cat file|nwdiag3 -o/dev/stdout -o/dev/stdin
          // of course node.js spawn doesn't provide /dev/stdout nor /dev/stdin
          // https://github.com/nodejs/node/issues/21941
          'sh',
          '-c',
                  `cat -| /usr/bin/${useConfig.visualizer}3 -a -T${useConfig.format} -o/dev/stdout /dev/stdin|cat`]
        // ALSO alas nwdiag's PNG library requires a seekable stream , which no pipe can provide
        // issue is in  /usr/lib/python3/dist-packages/PIL/Image.py 2209, fp = builtins.open(filename, "w+b")
        // ie opening binary write AND read file. Remove + fixes problem,but comment above shows for TIFFs this is required
        // also not nwdiag code, mock? import buildins..builtins.open=my_open?
      } else {
        if (useConfig.isPipeMarker(useConfig.visualizedGraph)) {
          useConfig.throwError('Alas *diags dont support dumping PNG to console')
        }
        return [
          'sh',
          '-c',
                  `cat -| /usr/bin/${useConfig.visualizer}3 -a -T${useConfig.format} -f/usr/share/fonts/truetype/dejavu//DejaVuSans-Bold.ttf -o${useConfig.visualizedGraph} /dev/stdin`]
      }
    case 'plantuml_sequence':
      // piping works
      return [
        'java',
        '-Djava.awt.headless=true',
        '-Xmx2048m',
        '-jar',
        plantUmlJar,
        `-t${useConfig.format.toLocaleLowerCase()}`,
        // '-nbthread auto', no effect
        // '-darkmode', odd...some versions had this, latest on ubuntu not
        '-p']
    case 'mscgen':
      // piping works
      return [`${useConfig.visualizer}`,
        '-i-',
        '-o-',
        `-T${useConfig.format}`]
    case 'neato':
    case 'twopi':
    case 'circo':
    case 'fdp':
    case 'sfdp':
    case 'dot':
    case 'osage':
      // piping works
      return [`${useConfig.visualizer}`,
        '-q',
        `-T${useConfig.format}`]
    default:
      // TODO: ACTUALLY have a better check, there's no NICE list of web only visualizers available YET
      if (!_isHackyWebVisualizer(useConfig)) {
        useConfig.throwError(`Currently not supported visualizer (web visualizer?)==(${useConfig.visualizer})`)
      }
      return _webRender
  }
}

function _prepProcess (child, gotStdout, gotStdErr) {
  if (gotStdout) { child.stdout.on('data', gotStdout) }
  if (gotStdErr) { child.stderr.on('data', gotStdErr) }
  return child
}

function _exitError (useConfig, msg) {
  useConfig.printError(msg)
  process.exit(10)
}

export async function doVisualize (
  useConfig,
  /** @type {string} */generatedGraphCode,
  /** @type {string} */visualizer,
  /** @type {(exitcode:number)=>void]} */finished) {
  if (generatedGraphCode === '') {
    useConfig.throwError('no parsed code')
  }

  if (_isHackyWebVisualizer(useConfig)) {
    const cmd = _getVisualizerCommand(useConfig)
    if (typeof (cmd) !== 'function') {
      useConfig.throwError('fix the code')
    }
    // since we won't use lexer, parser nor regular visualizer,we're left to load the code on our own
    // TODO: isolate and share with diagrammer.js
    await cmd(useConfig, useConfig.visualizer, generatedGraphCode, useConfig.visualizedGraph)
    process.exit(0)
  }

  const _processes = []
  useConfig.tp('Going to run visualizer')
  // uh, nwdiag(all diags) use buggy PIL library opening R&W (seekable) access to pipe
  const outputFileStream = (useConfig.isPipeMarker(useConfig.visualizedGraph) || useConfig.buggyDiag)
    ? undefined
    : fs.openSync(useConfig.visualizedGraph, 'w')
  const cmd = _getVisualizerCommand(useConfig)
  // TODO: web viz hack... remove
  if (typeof (cmd) === 'function') {
    await cmd(useConfig, visualizer, generatedGraphCode, useConfig.visualizedGraph)
    process.exit(0)
  }

  const visualizationProcess = _startVisualizer(useConfig, outputFileStream, cmd, undefined,
    (stdout) => useConfig.printError(String(stdout)))

  if (useConfig.isPipeMarker(useConfig.visualizedGraph) && !useConfig.buggyDiag) {
    useConfig.tp('pipe visualization output to this stdout')
    visualizationProcess.stdout.pipe(process.stdout)
  }

  visualizationProcess.stdin.on('error', (error) => {
    useConfig.tp(`stdin error... ${error}`)
    useConfig.dumpTraces()
  })
  visualizationProcess.stdin.setEncoding('utf-8')
  visualizationProcess.stdin.write(generatedGraphCode)
  _processes.push(visualizationProcess)
  visualizationProcess.stdin.end()

  await _waitForProcesses(useConfig, _processes).then((x) => {
    if (outputFileStream) {
      fs.closeSync(outputFileStream)
    }
    finished(visualizationProcess.exitCode)
  }, (rej) => {
    _exitError(`Failure ${rej}`)
  })
}
