import * as fs from 'fs'
import { spawn } from 'child_process'
// required to populate generators/visualizations
// eslint-disable-next-line no-unused-vars
import { diagrammerParser } from '../build/diagrammer_parser.js'
import { _getWebVisualizers } from './webvisualize.js'

function _startVisualizer (useConfig, optionalOutputFS, args) {
  const cmd = args[0]
  const aa = args.splice(1)

  useConfig.tp(`spawn ${cmd} ${aa.join(' ')} ${optionalOutputFS || 'No optional output fs defined'}`)
  const proc = spawn(cmd,
    aa,
    {
      stdio: [
        'pipe',
        optionalOutputFS || 'pipe',
        'pipe'],
      shell: true
    })
  proc.stderr.on('data', (stderr) => useConfig.printError(String(stderr)))
  proc.title = 'VISUALIZER'
  return proc
}

export function _isHackyWebVisualizer (config, overrideVisualizer) {
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
    case 'blockdiag': {
      const font = '/usr/share/fonts/truetype/dejavu//DejaVuSans-Bold.ttf'
      if (useConfig.redirectingDiag) {
        return [
          `${useConfig.visualizer}`,
          '-a',
          `-T${useConfig.format}`,
          '-f',
          font,
          '-',
          `-o${useConfig.visualizedGraph}`]
      } else {
        return [
          // piping works if running as cat file|nwdiag3 -o/dev/stdout -o/dev/stdin
          // of course node.js spawn doesn't provide /dev/stdout nor /dev/stdin
          // https://github.com/nodejs/node/issues/21941
          'sh',
          '-c',
          `cat -| /usr/bin/${useConfig.visualizer}3 -a -T${useConfig.format} -f/usr/share/fonts/truetype/dejavu//DejaVuSans-Bold.ttf -o/dev/stdout /dev/stdin|cat`]
      }
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
      return undefined
  }
}

function _exitError (useConfig, msg) {
  useConfig.printError(msg)
  process.exit(10)
}

/**
 * @returns  {boolean} true if this is cli visualizer
 */
export function isCliVisualizer (useConfig) {
  return _getVisualizerCommand(useConfig)
}

export async function doCliVisualize (
  useConfig,
  /** @type {string} */generatedGraphCode,
  /** @type {string} */visualizer,
  /** @type {(exitcode:number)=>void]} */finished) {
  useConfig.tp('Going to run visualizer')
  const cmd = _getVisualizerCommand(useConfig)
  if (!cmd) {
    throw new Error(`Could not figure out visualizer command for ${visualizer}`)
  }
  const isRedirectingDiagRun = () => {
    return useConfig.isPipeMarker(useConfig.visualizedGraph) &&
    ['nwdiag', 'seqdiag', 'actdiag', 'blockdiag'].includes(useConfig.visualizer) && useConfig.redirectingDiag
  }

  const outputFileStream = (useConfig.isPipeMarker(useConfig.visualizedGraph) || isRedirectingDiagRun())
    ? undefined
    // uh, nwdiag(all diags) use buggy PIL library opening R&W (seekable) access to pipe - rending piping broken
    // GitHub blockdiag HEAD is better, but redirection is broken
    : fs.openSync(useConfig.visualizedGraph, 'w')

  const visualizationProcess = _startVisualizer(useConfig,
    outputFileStream, cmd)

  useConfig.tp(`output ${useConfig.visualizedGraph}`)
  // TODO: until *diag stdio fix is merged
  if (!outputFileStream) {
    useConfig.tp('pipe visualization output to this stdout')
    visualizationProcess.stdout.pipe(process.stdout)
  }

  visualizationProcess.stdin.on('error', (error) => {
    useConfig.tp(`stdin error... ${error}`)
    useConfig.dumpTraces()
  })
  visualizationProcess.stdin.setEncoding('utf-8')
  visualizationProcess.stdin.write(generatedGraphCode)
  const _processes = [visualizationProcess]
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
