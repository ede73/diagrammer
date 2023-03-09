#!/usr/bin/env node
import * as fs from 'fs'
import { spawn } from 'child_process'
import path from 'path'
// required to populate generators/visualizations
// eslint-disable-next-line no-unused-vars
import { diagrammerParser } from '../build/diagrammer_parser.js'
import { generators, visualizations } from '../model/graphcanvas.js'
import puppeteer from 'puppeteer'
import { singleElementScreenSnapshot } from '../tests/web/snapshot_single_element.js'
// uh oh..this RUNS code in:
// tests/web/diagrammer_support.js
// web/editorInteractions.js
// web/parserInteractions.js
// (naturally)
// Alas, since they DO use console.log's... output gets messy
import {
  clearGeneratorResults, clearParsingErrors, getParsingError,
  selectGeneratorVisualizer, setDiagrammerCode, waitForGeneratorResults, waitUntilGraphDrawn
} from '../tests/web/diagrammer_support.js'
import { configSupport } from '../js/configsupport.js'
import { doLex, doParse } from '../js/diagrammer.js'

async function sshot (page) {
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

async function webRender (useConfig, visualizer, code, outputShot) {
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
    await sshot(page)
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

function visualizerToGenerator () {
  const visualiserToGenerator = new Map()
  visualizations.forEach((visualizers, generator) => {
    visualizers.forEach((visualizer, index) => {
      visualiserToGenerator.set(visualizer, generator)
    })
  })

  const g = Array.from(generators.keys()).map(k => [k, k])
  return new Map([...visualiserToGenerator, ...g])
}

export function getEmptyConfig () {
  return configSupport('t.js', {
    tests: false,
    text: false,
    format: 'png',
    dontRunVisualizer: false,
    visualizer: '',
    visualizedGraph: '-',
    buggyDiag: false,
    parsedCode: '',
    written: 0
  })
}

function _exitError (useConfig, msg) {
  useConfig.printError(msg)
  process.exit(10)
}

function _prepProcess (child, gotStdout, gotStdErr) {
  if (gotStdout) { child.stdout.on('data', gotStdout) }
  if (gotStdErr) { child.stderr.on('data', gotStdErr) }
  return child
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
function _getWebVisualizers () {
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

function _resolveGenerator (useConfig) {
  const generator = visualizerToGenerator().get(useConfig.visualizer)
  if (!generator) {
    throw Error(`Cannot map visualizer (${useConfig.visualizer}) to a generator`)
  }
  return generator
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
                  `cat -| /usr/bin/${useConfig.visualizer}3 -a -T${useConfig.format} -o${useConfig.visualizedGraph} /dev/stdin`]
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
        useConfig.throwError(`Currently not supported visualizer (web visualizer?) ${useConfig.visualizer}`)
      }
      return webRender
  }
}

export async function lexParseAndVisualize (useConfig, visualizationisComplete) {
  if (useConfig.isPipeMarker(useConfig.input) && !useConfig.beingPiped()) {
    _exitError(useConfig, 'Supposed to receive graph via pipe, but not being piped!')
  } else if (!useConfig.input || !fs.existsSync(useConfig.input)) {
    _exitError(useConfig, `Existing input file required, got "${useConfig.input}", check usage -h`)
  }

  if (_isHackyWebVisualizer(useConfig)) {
    const cmd = _getVisualizerCommand(useConfig)
    if (typeof (cmd) !== 'function') {
      useConfig.throwError('fix the code')
    }
    // since we won't use lexer, parser nor regular visualizer,we're left to load the code on our own
    // TODO: isolate and share with diagrammer.js
    useConfig.code = await useConfig.readFile(useConfig.input)
    if (useConfig.code.trim() === '') {
      useConfig.throwError('No code...')
    }
    await cmd(useConfig, useConfig.visualizer, useConfig.code, useConfig.visualizedGraph)
    process.exit(0)
  }

  useConfig.code = await useConfig.readFile(useConfig.input)

  useConfig.tp(`Config: ${JSON.stringify(useConfig)}`)
  // use lexer (separate lexer test process) only during test runs
  if (useConfig.tests) {
    useConfig.tp('Prepare lexical tester')
    doLex(useConfig, useConfig.code, (token, codePart) => {
      if (useConfig.trace) { useConfig.tp(`LEX: ${token} ${codePart}`) }
    })
  }

  useConfig.tp('Start parsing process')
  const _processes = []

  // TODO: temp, remove when web viz..finished
  if (_isHackyWebVisualizer(useConfig.visualizer)) {
    useConfig.throwError('No point parsing just webvisualizer code')
  }

  let errors = 0
  doParse(
    useConfig,
    useConfig.code,
    _resolveGenerator(useConfig),
    (result) => {
      useConfig.parsedCode += `${result}\n`
    }, (parseError, hash) => {
      useConfig.tp(`Parse error: ${parseError} ${hash}`)
      errors++
    }, (trace) => {
      if (useConfig.trace) {
        useConfig.tp(`parser trace: ${trace}`)
      }
    })

  if (errors) {
    visualizationisComplete(666)
    return
  }
  if (!useConfig.dontRunVisualizer && !_isHackyWebVisualizer(useConfig)) {
    useConfig.tp('Going to run visualizer')
    // uh, nwdiag(all diags) use buggy PIL library opening R&W (seekable) access to pipe
    const outputFileStream = (useConfig.isPipeMarker(useConfig.visualizedGraph) || useConfig.buggyDiag)
      ? undefined
      // something fishy with pipes
      //  https://stackoverflow.com/questions/61856264/node-piping-process-stdout-doesnt-drain-automatically
      // I couldn't figure out the writestream stdout usage, it mostly works, but sometimes
      // last chunk goes missing, or piping doesn't start at all.
      // Former, unknonw, latter, perhaps the fact the stream is opened async (even though i DID wait for it)
      // fs.createWriteStream(useConfig.visualizedGraph, { flags: 'w', autoClose: true })
      : fs.openSync(useConfig.visualizedGraph, 'w')
    if (useConfig.parsedCode === '') {
      useConfig.throwError('no parsed code')
    }
    const cmd = _getVisualizerCommand(useConfig)
    // TODO: web viz hack... remove
    if (typeof (cmd) === 'function') {
      await cmd(useConfig.visualizer, 'a>b>c>d>e', useConfig.visualizedGraph)
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
    visualizationProcess.stdin.write(useConfig.parsedCode)
    visualizationProcess.stdin.end()
    _processes.push(visualizationProcess)

    await _waitForProcesses(useConfig, _processes).then((x) => {
      if (outputFileStream) {
        fs.closeSync(outputFileStream)
      }
      visualizationisComplete(visualizationProcess.exitCode)
    }, (rej) => {
      _exitError(`Failure ${rej}`)
    })
  } else {
    // not running visualization, so we're all done here
    visualizationisComplete(0)
  }
}

async function _main (argv) {
  const config = getEmptyConfig()
  function _usage () {
    const visualizers = Array.from(visualizerToGenerator().keys())
    config.printError(`USAGE: [silent] [dont_run_visualizer] [tests] [verbose] [text] [svg] [output file] [INPUT] [${visualizers.join(', ')}]`)
    config.printError('Each visualizer will get converted to proper generator')
    config.printError(`Experimental: Web only renderers: [${_getWebVisualizers().join(', ')}]`)
    process.exit(0)
  }

  let _collectOutput = false
  await config.parseCommandLine(argv.splice(1), _usage, async (unknownCommandLineOption) => {
    if (_collectOutput) {
      _collectOutput = false
      config.visualizedGraph = unknownCommandLineOption.trim()
      return
    }
    switch (unknownCommandLineOption.toLocaleLowerCase().trim()) {
      case 'output':
        _collectOutput = true
        return
      // TODO:
      case 'skipparsermake':
        config.skipparsermake = true
        return
      case 'tests':
        config.tests = true
        return
      // TODO:
      case 'text':
        config.text = true
        return
      case 'svg':
        config.format = 'svg'
        return
      case 'dont_run_visualizer':
        config.dontRunVisualizer = true
        return
    }
    if (config.isPipeMarker(unknownCommandLineOption)) {
      // we're told we're being piped
      if (!config.beingPiped()) {
        config.throwError('Expecting piped input')
      }
      config.input = config.pipeMarker
      return
    }
    // Allow using absolute and relative paths! (currently abs.paths dont work)
    // ALSO detect piping/redirection and make 'em work
    if (!config.input && fs.existsSync(unknownCommandLineOption)) {
      config.input = unknownCommandLineOption.trim()
      return
    }
    // must be generator
    const visualizer = unknownCommandLineOption.toLocaleLowerCase()
    const v = visualizerToGenerator()
    if (v.has(visualizer) || _isHackyWebVisualizer(config, visualizer)) {
      config.visualizer = visualizer
    }
    if (!_isHackyWebVisualizer(config) && (!config.visualizer || !_resolveGenerator(config))) {
      config.throwError(`Could not determine visualizer (${visualizer}) (nor its generator)`)
    }
  })

  if (!config.input && config.beingPiped()) {
    config.input = config.pipeMarker
  }
  if (config.beingPiped()) {
    // we're probably being piped!
    config.input = config.pipeMarker
  }
  config.tp('Begin lexParseAndVisualize')
  console.error(config)
  await lexParseAndVisualize(config, () => {
    config.tp('Visualization has been completed')
  })
}

if (`${process.argv[1]}`.endsWith('t.js')) {
  // this script sits in js, so going one path level up is expected
  process.chdir(path.join(path.dirname(process.argv[1]), '..'))
  await _main(process.argv.splice(1))
}
