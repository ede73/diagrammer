#!/usr/bin/env node
import * as fs from 'fs'
import { spawn } from 'child_process'
// required to populate generators/visualizations
import { diagrammerParser } from '../build/diagrammer_parser.js'
import { generators, visualizations } from '../model/graphcanvas.js'
import { output } from '../model/support.js'

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

export const config = {
  tests: false,
  verbose: false,
  trace: false,
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

function printError (msg) {
  console.error(`${msg}`)
}

function traceProcess (msg) {
  // console.log(`trace:${msg}`)
}

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

function _startProcess (args, gotStdout, gotStdErr, fd) {
  const options = { stdio: ['pipe', fd || 'pipe', 'pipe'] }
  const cmd = args[0]
  const a = args.splice(1)
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

function _startGenerator (useConfig, gotStdout, gotStdErr) {
  const args = ['node', 'js/diagrammer.js']
  if (useConfig.verbose) {
    args.push('verbose')
  }
  if (useConfig.trace) {
    args.push('trace')
  }
  args.push(useConfig.input)
  args.push(_resolveGenerator(useConfig))
  return _startProcess(args, gotStdout, gotStdErr)
}

function _startVisualizer (fd, args, gotStdout, gotStdErr) {
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
  if (!useConfig.input || !fs.existsSync(useConfig.input)) {
    _exitError(`Existing input file required, got "${useConfig.input}", check usage -h`)
  }
  const _lexingProcess = _startLexerTest(useConfig, _stdout(useConfig), _stderr('lexer'))
  const _parsingProcess = _startGenerator(useConfig, _stdoutCollect(useConfig), _stderr('parser'))

  const _processes = [_lexingProcess, _parsingProcess]

  let outputFileStream
  if (!useConfig.dontRunVisualizer) {
    traceProcess(useConfig)
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
      traceProcess(`${visualizationProcess.exitCode} is the failure`)
      if (visualizationProcess.exitCode != 0) {
        traceProcess(`${useConfig.parsedCode}`)
      }
      visualizationisComplete(visualizationProcess.exitCode)
    })

    _parsingProcess.stdout.pipe(visualizationProcess.stdin).on('error', err =>
      printError(`mf! ${err}`)
    )

    if (useConfig.visualizedGraph === '-' && !useConfig.buggyDiag) {
      traceProcess('DIAG DUMPING DMMPING')
      visualizationProcess.stdout.pipe(process.stdout)
    }
    _processes.push(visualizationProcess)
  }

  await _waitForProcesses(useConfig, _processes).then((x) => {
    // all done...
    traceProcess(` All processed related to ${useConfig.visualizedGraph} have been completed`)
  }, (rej) => {
    _exitError(`Failure ${rej}`)
  })

  if (_processes.length === 3 && _processes[2].exitCode !== 0) {
    throw new Error(`Visualizer ${useConfig.visualizer} failed processing ${useConfig.input} code=${_processes[2].exitCode}`)
  }
}

function _main (argv) {
  function _usage () {
    const visualizers = visualizerToGenerator().flatMap((k, v) => k[1])
    console.log(`USAGE: [silent] [dont_run_visualizer] [tests] [verbose] [text] [svg] [output file] [INPUT] [${visualizers.join(', ')}]`)
    console.log('  Notice! Visualizer (like twopi) will be converted to generator(digraph)')
    process.exit(0)
  }

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
    if (fs.existsSync(m.trim())) {
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

  lexParseAndVisualize(config, () => {
    traceProcess('Visualization has been completed')
  })
}

if (`${process.argv[1]}`.endsWith('t.js')) {
  _main(process.argv.splice(1))
}
