#!/usr/bin/env node
import * as fs from 'fs'
import { spawn } from 'child_process'

const config = {
  tests: false,
  verbose: false,
  trace: false,
  text: false,
  format: 'png',
  dont_run_visualizer: false,
  input: '',
  visualizer: 'dot',
  output: '-',
  buggy_diag: false
}

function _usage () {
  console.log('USAGE: [silent] [dont_run_visualizer] [tests] [verbose] [text] [svg] [output file] [INPUT] [VISUALIZER|dot]')
  console.log('  Notice! Visualizer (like twopi) will be converted to generator(digraph)')
  process.exit(0)
}

let _collectOutput = false
for (const m of process.argv.splice(2)) {
  if (_collectOutput) {
    _collectOutput = false
    config.output = m.trim()
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
      config.dont_run_visualizer = true
      continue
  }
  if (fs.existsSync(m.trim())) {
    config.input = m.trim()
    continue
  }
  config.visualizer = m.toLocaleLowerCase().trim()
}

function _exitError (msg) {
  console.error(msg)
  process.exit(10)
}

if (!config.input || !fs.existsSync(config.input)) {
  _exitError(`Existing input file required, got "${config.input}"`)
}

function _getGenerator () {
  switch (config.visualizer) {
    case 'neato':
    case 'twopi':
    case 'circo':
    case 'fdp':
    case 'osage':
    case 'sfdp':
    case 'dot':
      return 'digraph'
    default:
      return config.visualizer
  }
}

function _prepProcess (child, gotStdout, gotStdErr, closed) {
  if (gotStdout) { child.stdout.on('data', gotStdout) }
  if (gotStdErr) { child.stderr.on('data', gotStdErr) }
  if (closed) { child.on('close', closed) }
  return child
}

function _startProcess (args, gotStdout, gotStdErr, closed) {
  const options = { stdio: ['pipe', 'pipe', 'pipe'] }
  const cmd = args[0]
  const a = args.splice(1)
  const proc = spawn(cmd, a, options)
  return _prepProcess(proc, gotStdout, gotStdErr, closed)
}

function _startLexerTest (gotStdout, gotStdErr, closed) {
  return _startProcess(
    ['node', 'js/testStateLexer.js', config.input],
    gotStdout, gotStdErr, closed)
}

function _startGenerator (gotStdout, gotStdErr, closed) {
  const args = ['node', 'js/diagrammer.js']
  if (config.verbose) {
    args.push('verbose')
  }
  if (config.trace) {
    args.push('trace')
  }
  args.push(config.input)
  args.push(_getGenerator())
  return _startProcess(args, gotStdout, gotStdErr, closed)
}

function _startVisualizer (args, gotStdout, gotStdErr, closed) {
  return _startProcess(args, gotStdout, gotStdErr, closed)
}

const _waitForProcesses = (processes) => {
  return new Promise((resolve, reject) => {
    let completed = 0

    const onExit = (process) => () => {
      completed++
      // console.log(`${process.spawnargs} exited`)
      if (completed === processes.length) {
        resolve()
      }
    }

    processes.forEach((process) => {
      process.on('exit', onExit(process))
      process.on('error', reject)
    })
  })
}

function _getVisualizerCommand () {
  const plantUmlJar = 'ext/plantuml.jar'

  switch (config.visualizer) {
    case 'nwdiag':
    case 'seqdiag':
    case 'actdiag':
    case 'blockdiag':
      if (config.format !== 'svg') {
        config.buggy_diag = true
      }
      if (!config.buggy_diag) {
        // heh, it's still buggy, but we can circumvent
        return [
          // piping works if running as cat file|nwdiag3 -o/dev/stdout -o/dev/stdin
          // of course node.js spawn doesn't provide /dev/stdout nor /dev/stdin
          // https://github.com/nodejs/node/issues/21941
          'sh',
          '-c',
                  `cat -| /usr/bin/${config.visualizer}3 -a -T${config.format} -o/dev/stdout /dev/stdin|cat`]
        // ALSO alas nwdiag's PNG library requires a seekable stream , which no pipe can provide
        // issue is in  /usr/lib/python3/dist-packages/PIL/Image.py 2209, fp = builtins.open(filename, "w+b")
        // ie opening binary write AND read file. Remove + fixes problem,but comment above shows for TIFFs this is required
        // also not nwdiag code, mock? import buildins..builtins.open=my_open?
      } else {
        if (config.output === '-') {
          throw new Error('Alas *diags dont support dumping PNG to console')
        }
        return [
          'sh',
          '-c',
                  `cat -| /usr/bin/${config.visualizer}3 -a -T${config.format} -o${config.output} /dev/stdin`]
      }
    case 'plantuml_sequence':
      // piping works
      return [
        'java',
        '-Djava.awt.headless=true',
        '-Xmx2048m',
        '-jar',
        plantUmlJar,
        `-t${config.format.toLocaleLowerCase()}`,
        '-p']
    case 'mscgen':
      // piping works
      return [`${config.visualizer}`,
        '-i-',
        '-o-',
        `-T${config.format}`]
    case 'neato':
    case 'twopi':
    case 'circo':
    case 'fdp':
    case 'sfdp':
    case 'dot':
    case 'osage':
      // piping works
      return [`${config.visualizer}`,
        `-T${config.format}`]
    default:
      throw new Error(`Unknown visualizer ${config.visualizer}`)
  }
}

const _stdout = (stderr) => { if (config.trace) console.error(`${stderr}`) }
const _stderr = (stderr) => { console.error(`${stderr}`) }
const _closed = (app) => {
  return (code) => {
    if (code !== 0) { _exitError(`${app} failed`) }
  }
}

const _lexingProcess = _startLexerTest(_stdout, _stderr, _closed('Lexer'))
const _parsingProcess = _startGenerator(_stdout, _stderr, _closed('Parsing'))

const _processes = [_lexingProcess, _parsingProcess]

if (!config.dont_run_visualizer) {
  // uh, nwdiag(all diags) use buggy PIL library opening R&W (seekable) access to pipe
  const stream = (config.output === '-' || config.buggy_diag)
    ? undefined
    : fs.createWriteStream(config.output, { flags: 'w' })

  // We're to run the visualizer also!
  const cmd = _getVisualizerCommand()
  const visualizationProcess = _startVisualizer(
    cmd,
    (stdout) => {
      if (stream) stream.write(stdout)
    },
    _stderr,
    (closed) => {
      if (stream) stream.close()
    })
  _parsingProcess.stdout.pipe(visualizationProcess.stdin)
  if (config.output === '-' && !config.buggy_diag) {
    visualizationProcess.stdout.pipe(process.stdout)
  }
  _processes.push(visualizationProcess)
}

await _waitForProcesses(_processes).then((x) => {
  // all done...
}, (rej) => {
  console.error(`Failure ${rej}`)
})
process.exit(0)
