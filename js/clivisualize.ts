import * as fs from 'fs'
import { spawn, type ChildProcess } from 'child_process'
import { type ConfigType } from './configsupport.js'
import { type VisualizeConfigType } from './visualizeConfigType.js'
import { visualizations } from './config.js'

function _startVisualizer(useConfig: VisualizeConfigType, optionalOutputFS: number | undefined, args: string[]) {
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
  proc.stderr?.on('data', (stderr) => { useConfig.printError(String(stderr)) })
  // proc.title = 'VISUALIZER' // title exists, but not on this type :(
  return proc
}

const _waitForProcesses = async (useConfig: ConfigType, processes: ChildProcess[]) => {
  return await new Promise((resolve, reject) => {
    let completed = 0

    const onExit = (process: ChildProcess) => () => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      useConfig.tp(`  (Visualizer exited with ${process.exitCode})`)
      completed++
      if (completed === processes.length) {
        resolve(0)
      }
    }

    processes.forEach((process) => {
      process.on('exit', onExit(process))
      process.on('error', (r: Error) => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        useConfig.printError(`Something went wrong with visualizer - ${r}`)
        useConfig.dumpTraces()
        reject(r)
      })
    })
  })
}

function _exitError(useConfig: ConfigType, msg: string) {
  useConfig.printError(msg)
  process.exit(10)
}

/**
 * @returns  {boolean} true if this is cli visualizer
 */
export function supportsCliVisualization(useConfig: VisualizeConfigType) {
  const v = visualizations.find(p => p.name == useConfig.visualizer)
  return v?.cli
}

export async function doCliVisualize(
  useConfig: VisualizeConfigType,
  generatedGraphCode: string,
  visualizer: string,
  finished: (exitcode: number) => void) {
  useConfig.tp('Going to run visualizer')
  const cliCmd = visualizations.find(p => p.name === useConfig.visualizer)?.cli
  if (!cliCmd) {
    throw new Error(`Could not figure out visualizer command for ${visualizer}`)
  }
  const args = cliCmd(useConfig.format)
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
    outputFileStream, args)

  useConfig.tp(`output ${useConfig.visualizedGraph}`)
  // TODO: until *diag stdio fix is merged
  if (!outputFileStream) {
    if (useConfig?.returnImage) {
      useConfig.tp('Collect the image for miniserver')
      visualizationProcess.stdout?.setEncoding('latin1')
      useConfig.outputImage = ''
      visualizationProcess.stdout?.on('data', (stdout: string) => {
        useConfig.outputImage += stdout
      })
      // visualizationProcess.stdout.on('end', (stdout) => {
      //   console.warn('STDOUT DATA IS NOW READY')
      //   fs.writeFileSync('/tmp/c.png', useConfig.outputImage)
      // })
      // no matter what, node.js is reading shit..not actual data
      // visualizationProcess.stdout.on('readable', () => {
      //   let chunk
      //   while ((chunk = visualizationProcess.stdout.read()) !== null) {
      //     useConfig.outputImage += chunk
      //   }
      // })
    } else {
      useConfig.tp('pipe visualization output to this stdout')
      visualizationProcess.stdout?.pipe(process.stdout)
    }
  }

  visualizationProcess.stdin?.on('error', (error) => {
    // error could be anything really
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    useConfig.tp(`stdin error... ${error}`)
    useConfig.dumpTraces()
  })
  // visualizationProcess.stdin?.setEncoding('utf-8')
  visualizationProcess.stdin?.write(generatedGraphCode)
  const _processes = [visualizationProcess]
  visualizationProcess.stdin?.end()

  await _waitForProcesses(useConfig, _processes).then((x) => {
    if (outputFileStream) {
      fs.closeSync(outputFileStream)
    }
    finished(visualizationProcess.exitCode ?? -1)
  }, (rej) => {
    // rej could be anything really
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    _exitError(useConfig, `Failure ${rej}`)
  })
}
