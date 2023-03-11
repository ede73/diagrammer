import * as tty from 'node:tty'
import * as fs from 'fs'

// TODO: Convert to TypeScript

// augment config object literal with some commonly shared utility functions
export const configSupport = (scriptName, cfg) => {
  cfg.verbose = false
  cfg.trace = false
  cfg.traceProcess = false
  cfg.input = ''
  cfg.traces = ''
  cfg.redirectingDiag = true // I've a patched version
  cfg.tp = function (msg) {
    this.traces += `${this.input}:${this.visualizer}:${process.hrtime.bigint()} ${scriptName} ${msg}\n`
    if (this.traceProcess) {
      this.printError(`trace:${msg}`)
    }
  }
  cfg.pipeMarker = '-'
  cfg.isPipeMarker = function (inputFile) {
    return inputFile === cfg.pipeMarker
  }
  cfg.dumpTraces = function () {
    this.printError(this.traces)
  }
  cfg.printError = function (msg) {
    console.error(`${msg}`)
  }
  cfg.beingPiped = function () {
    return !(process.stdin instanceof tty.ReadStream)
  }
  cfg.throwError = function (msg) {
    this.tp(msg)
    this.dumpTraces()
    throw new Error(msg)
  }
  cfg.readFile = async function (filePath) {
    if (filePath === '-') {
      this.tp('Reading from stdin..')
      if (!cfg.beingPiped()) {
        this.throwError('Failure imminent, reading piped input and not being piped')
      }
      return await (() => {
        return new Promise(function (resolve, reject) {
          const stdin = process.stdin
          let data = ''
          stdin.setEncoding('utf8')
          stdin.on('data', function (chunk) { data += chunk })
          stdin.on('end', function () { resolve(data) })
          stdin.on('error', reject)
        })
      })().catch(rejected => {
        this.tp(`Failure ${rejected}`)
        this.dumpTraces()
      })
    } else {
      return fs.readFileSync(filePath, 'utf8')
    }
  }
  cfg.parseCommandLine = async function (args, _usage, unknownCommandLineOption) {
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
      await unknownCommandLineOption(m.trim())
    }
  }
  return cfg
}
