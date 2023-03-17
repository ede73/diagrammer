import * as tty from 'node:tty'
import * as fs from 'fs'

export interface ConfigType {
  verbose: boolean
  trace: boolean
  traceProcess: boolean
  input: string
  traces: string
  redirectingDiag: boolean
  tp: (msg: string) => void
  pipeMarker: string
  isPipeMarker: (inputFile: string) => boolean
  dumpTraces: () => void
  printError: (msg: string) => void
  beingPiped: () => boolean
  throwError: (err: string) => void
  readFile: (filePath: string) => Promise<string>
  parseCommandLine: (args: string[], _usage: () => void, processUnknownCommand: (arg: string) => Promise<void>) => Promise<void>
}

// augment config object literal with some commonly shared utility functions
export const configSupport = <SubConfigType extends ConfigType>(scriptName: string, icfg: Partial<SubConfigType>): SubConfigType => {
  const cfg: SubConfigType = icfg as SubConfigType
  cfg.verbose = false
  cfg.trace = false
  cfg.traceProcess = false
  cfg.input = ''
  cfg.traces = ''
  cfg.redirectingDiag = true // I've a patched version
  cfg.tp = function (msg: string) {
    const c = this as SubConfigType
    const visualizer = (c as any).visualizer ? (c as any).visualizer as string : ''
    // TODO: probably missing visualizer (e.g./generate.js)
    c.traces += `${c.input}:${visualizer}:${process.hrtime.bigint()} ${scriptName} ${msg}\n`
    if (this.traceProcess) {
      this.printError(`trace:${msg}`)
    }
  }
  cfg.pipeMarker = '-'
  cfg.isPipeMarker = function (inputFile: string) {
    return inputFile === cfg.pipeMarker
  }
  cfg.dumpTraces = function () {
    this.printError(this.traces)
  }
  cfg.printError = function (msg: string) {
    console.error(`${msg}`)
  }
  cfg.beingPiped = function () {
    return !(process.stdin instanceof tty.ReadStream)
  }
  cfg.throwError = function (msg: string) {
    this.tp(msg)
    this.dumpTraces()
    throw new Error(msg)
  }
  cfg.readFile = async function (filePath: string): Promise<string> {
    if (filePath === '-') {
      this.tp('Reading from stdin..')
      if (!cfg.beingPiped()) {
        this.throwError('Failure imminent, reading piped input and not being piped')
      }

      const stdin = process.stdin
      stdin.setEncoding('utf8')
      async function read() {
        const chunks = []
        for await (const chunk of stdin) chunks.push(chunk)
        return Buffer.concat(chunks).toString('utf8')
      }
      return await read()
    } else {
      return fs.readFileSync(filePath, 'utf8')
    }
  }
  cfg.parseCommandLine = async function (args: string[], _usage: () => void, processUnknownCommand: (arg: string) => Promise<void>) {
    for (const m of args) {
      cfg.tp(`Parsing (${m})`)
      switch (m.toLocaleLowerCase().trim()) {
        case '-h':
        case '--help':
        case 'help':
          _usage()
          continue
        case 'brokendiag':
          // TODO: remove if merged, See https://github.com/ede73/blockdiag
          this.redirectingDiag = false
          continue
        case 'verbose':
          this.verbose = true
          continue
        case 'trace':
          this.trace = true
          continue
        case 'traceprocess':
          this.traceProcess = true
          continue
      }
      if (this.isPipeMarker(m)) {
        cfg.tp('piped')
        // we're told we're being piped
        if (!this.beingPiped()) {
          this.throwError('Expecting piped input')
        }
        this.input = this.pipeMarker
        continue
      }
      cfg.tp(`pass unknown CLI option (${m}) to child`)
      await processUnknownCommand(m.trim())
    }
  }
  return cfg
}
