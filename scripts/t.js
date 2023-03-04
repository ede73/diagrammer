#!/usr/bin/env node
import * as fs from 'fs'
import { spawn } from 'child_process'
import * as tty from 'node:tty'
import path from 'path'
// required to populate generators/visualizations
// eslint-disable-next-line no-unused-vars
import { diagrammerParser } from '../build/diagrammer_parser.js'
import { generators, visualizations } from '../model/graphcanvas.js'

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
  return {
    tests: false,
    verbose: false,
    trace: false,
    traceProcess: false,
    text: false,
    format: 'png',
    dontRunVisualizer: false,
    input: '',
    visualizer: '',
    visualizedGraph: '-',
    buggyDiag: false,
    parsedCode: '',
    written: 0
  }
}

function printError (msg) {
  console.error(`${msg}`)
}

let traceProcess = (msg) => { }

function _exitError (msg) {
  printError(msg)
  process.exit(10)
}

function conciseId (useConfig) {
  return `${useConfig.visualizer} => ${useConfig.visualizedGraph}`
}

function _prepProcess (child, gotStdout, gotStdErr) {
  if (gotStdout) { child.stdout.on('data', gotStdout) }
  if (gotStdErr) { child.stderr.on('data', gotStdErr) }
  return child
}

function _startProcess (args, gotStdout, gotStdErr, fd, inheritStdin) {
  const options = { stdio: [inheritStdin ? 'inherit' : 'pipe', fd || 'pipe', 'pipe'] }
  const cmd = args[0]
  const a = args.splice(1)
  traceProcess(`spawn ${cmd} with ${a} options ${JSON.stringify(options)}`)
  const proc = spawn(cmd, a, options)
  return _prepProcess(proc, gotStdout, gotStdErr)
}

function _startLexerTest (useConfig, gotStdout, gotStdErr) {
  return _startProcess(
    ['node', 'js/diagrammer.js', 'lex', 'trace', useConfig.input],
    gotStdout, gotStdErr)
}

function _resolveGenerator (useConfig) {
  const generator = visualizerToGenerator().get(useConfig.visualizer)
  if (!generator) {
    throw Error(`Cannot map visualizer (${useConfig.visualizer}) to a generator`)
  }
  return generator
}

function _startParser (useConfig, gotStdout, gotStdErr) {
  const args = ['node', 'js/diagrammer.js']
  if (useConfig.verbose) {
    args.push('verbose')
  }
  if (useConfig.trace) {
    args.push('trace')
  }
  if (useConfig.traceProcess) {
    args.push('traceprocess')
  }
  args.push(useConfig.input)
  args.push(_resolveGenerator(useConfig))
  return _startProcess(args, gotStdout, gotStdErr, undefined, useConfig.input === '-')
}

function _startVisualizer (fd, args, gotStdout, gotStdErr) {
  traceProcess(`Start visualizer ${args}`)
  return _startProcess(args, gotStdout, gotStdErr, fd)
}

const _waitForProcesses = (useConfig, processes) => {
  return new Promise((resolve, reject) => {
    let completed = 0

    const onExit = (process) => () => {
      traceProcess(`  Process ${process.spawnargs} exited`)
      completed++
      if (completed === processes.length) {
        resolve()
      }
    }

    processes.forEach((process) => {
      process.on('exit', onExit(process))
      process.on('error', (r) => {
        printError(`Something went wrong...${r}`)
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
        if (useConfig.visualizedGraph === '-') {
          throw new Error('Alas *diags dont support dumping PNG to console')
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
        `-T${useConfig.format}`]
    default:
      throw new Error(`Currently not supported visualizer (web visualizer?) ${useConfig.visualizer}`)
  }
}

const _stdout = (useConfig) => (stdout) => {
  if (useConfig.trace) printError(`${stdout}`)
}

const _stdoutCollect = (useConfig) => (stdout) => {
  useConfig.parsedCode += stdout
  if (useConfig.trace) printError(`${stdout}`)
}

const _stderr = (who) => (stderr) => {
  console.error(`${who}: ${stderr}`)
}

export async function lexParseAndVisualize (useConfig, visualizationisComplete) {
  traceProcess = (msg) => {
    if (useConfig.traceProcess) {
      console.error(`trace:${msg}`)
    }
  }
  if (useConfig.input === '-') {
    if (!beingPiped()) {
      _exitError('Supposed to receive graph via pipe, but not being piped!')
    }
    traceProcess('Expecting piped input')
  } else if (!useConfig.input || !fs.existsSync(useConfig.input)) {
    _exitError(`Existing input file required, got "${useConfig.input}", check usage -h`)
  }
  const _processes = []

  // use lexer (separate lexer test process) only during test runs
  if (useConfig.tests) {
    traceProcess('Prepare lexical tester')
    const _lexingProcess = _startLexerTest(useConfig, _stdout(useConfig), _stderr('lexer'))
    _processes.push(_lexingProcess)
  }

  traceProcess('Start parsing process')
  const _parsingProcess = _startParser(useConfig, _stdoutCollect(useConfig), _stderr('parser'))
  _processes.push(_parsingProcess)

  traceProcess(`Config: ${JSON.stringify(useConfig)}`)
  let outputFileStream

  if (!useConfig.dontRunVisualizer) {
    traceProcess('Going to run visualizer')
    // uh, nwdiag(all diags) use buggy PIL library opening R&W (seekable) access to pipe
    outputFileStream = (useConfig.visualizedGraph === '-' || useConfig.buggyDiag)
      ? undefined
      // something fishy with pipes
      //  https://stackoverflow.com/questions/61856264/node-piping-process-stdout-doesnt-drain-automatically
      // I couldn't figure out the writestream stdout usage, it mostly works, but sometimes
      // last chunk goes missing, or piping doesn't start at all.
      // Former, unknonw, latter, perhaps the fact the stream is opened async (even though i DID wait for it)
      // fs.createWriteStream(useConfig.visualizedGraph, { flags: 'w', autoClose: true })
      : fs.openSync(useConfig.visualizedGraph, 'w')

    const cmd = _getVisualizerCommand(useConfig)
    const visualizationProcess = _startVisualizer(outputFileStream, cmd, undefined,
      (stdout) => console.error(String(stdout)))

    visualizationProcess.on('exit', async () => {
      traceProcess(`  ${conciseId(useConfig)} EXT`)
      if (visualizationProcess.exitCode !== 0) {
        traceProcess(`${useConfig.parsedCode}`)
      }
      visualizationisComplete(visualizationProcess.exitCode)
    })

    _parsingProcess.stdout.pipe(visualizationProcess.stdin).on('error', err =>
      printError(`mf! ${err}`)
    )

    if (useConfig.visualizedGraph === '-' && !useConfig.buggyDiag) {
      visualizationProcess.stdout.pipe(process.stdout)
    }
    _processes.push(visualizationProcess)
  }

  traceProcess(`Wait for all the processes (${_processes.length})`)
  await _waitForProcesses(useConfig, _processes).then((x) => {
    // all done...
    traceProcess(` All processed related to ${useConfig.visualizedGraph} have been completed`)
  }, (rej) => {
    _exitError(`Failure ${rej}`)
  })

  // TODO: move to exit above..
  if (_processes.length === 3 && _processes[2].exitCode !== 0) {
    throw new Error(`Visualizer ${useConfig.visualizer} failed processing ${useConfig.input} code=${_processes[2].exitCode}`)
  }
}

function beingPiped () {
  return !(process.stdin instanceof tty.ReadStream)
}

async function _main (argv) {
  function _usage () {
    const visualizers = Array.from(visualizerToGenerator().keys())
    console.log(`USAGE: [silent] [dont_run_visualizer] [tests] [verbose] [text] [svg] [output file] [INPUT] [${visualizers.join(', ')}]`)
    console.log('  Notice! Visualizer (like twopi) will be converted to generator(digraph)')
    process.exit(0)
  }

  const config = getEmptyConfig()
  let _collectOutput = false
  for (const m of argv.splice(1)) {
    if (_collectOutput) {
      _collectOutput = false
      config.visualizedGraph = m.trim()
      continue
    }
    switch (m.toLocaleLowerCase().trim()) {
      case '-h':
      case '--help':
      case 'help':
        _usage()
        continue
      case 'output':
        _collectOutput = true
        continue
      case 'skipparsermake':
        config.skipparsermake = true
        continue
      case 'tests':
        config.tests = true
        continue
      case 'verbose':
        config.verbose = true
        continue
      case 'trace':
        config.trace = true
        continue
      case 'traceprocess':
        config.traceProcess = true
        continue
      case 'text':
        config.text = true
        continue
      case 'svg':
        config.format = 'svg'
        continue
      case 'dont_run_visualizer':
        config.dontRunVisualizer = true
        continue
    }

    if (m === '-') {
      // we're told we're being piped
      if (!beingPiped()) {
        throw new Error('Expecting piped input')
      }
      config.input = '-'
      continue
    }

    // Allow using absolute and relative paths! (currently abs.paths dont work)
    // ALSO detect piping/redirection and make 'em work
    if (!config.input && fs.existsSync(m.trim())) {
      config.input = m.trim()
      continue
    }
    // must be generator
    const visualizer = m.toLocaleLowerCase().trim()
    const v = visualizerToGenerator()
    if (v.has(visualizer)) {
      config.visualizer = visualizer
    }
    if (!config.visualizer || !_resolveGenerator(config)) {
      throw new Error(`Could not determine visualizer (${visualizer}) (nor its generator)`)
    }
  }
  if (!config.input && beingPiped()) {
    config.input = '-'
  }
  if (beingPiped()) {
    // we're probably being piped!
    config.input = '-'
  }
  await lexParseAndVisualize(config, () => {
    traceProcess('Visualization has been completed')
  })
}

if (`${process.argv[1]}`.endsWith('t.js')) {
  // this script sits in js, so going one path level up is expected
  process.chdir(path.join(path.dirname(process.argv[1]), '..'))
  await _main(process.argv.splice(1))
}
