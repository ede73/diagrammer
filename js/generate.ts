#!/usr/bin/env node

import * as fs from 'fs'
import { generators } from '../model/graphcanvas.js'
import { setVerbose } from '../model/debug.js'
import { configSupport, type ConfigType } from './configsupport.js'
import { doParse } from './diagrammer.js'

export interface GenerateConfigType extends ConfigType {
  generator: string
  code: string
  parsedCode: string
}

const config: GenerateConfigType = configSupport<GenerateConfigType>('generate.js', {
  generator: '',
  code: '',
  parsedCode: ''
})

function _usage() {
  config.printError('USAGE: [trace] [verbose] [INPUT] [GENERATOR]')
  process.exit(0)
}

await config.parseCommandLine(process.argv.splice(2), _usage, async (unknownCommandLineOption) => {
  if (!config.input && fs.existsSync(unknownCommandLineOption)) {
    if (config.code) {
      config.throwError('Something is wrong, going to read the code twice')
    }
    config.tp(`Read diagrammer code from ${unknownCommandLineOption}`)
    config.input = unknownCommandLineOption.trim()
    config.code = await config.readFile(config.input)
    return
  }
  // must be generator
  const generator = unknownCommandLineOption.toLocaleLowerCase()
  if (!generators.has(generator)) {
    config.throwError(`Unknown generator (${generator})`)
  }
  config.generator = generator
})

if (config.verbose) {
  setVerbose(true)
}
if (config.trace) {
  config.printError("# If you didn't compile with DEBUG=1 make, deep tracing the grammar won't work")
}
if (config.beingPiped()) {
  // we're probably being piped!
  config.tp('Reading from pipe')
  config.input = config.pipeMarker
  config.code = await config.readFile(config.pipeMarker)
}
if (!config.input) {
  _usage()
}

if (!config.code) {
  config.throwError('Failed reading code to parse')
}
if (!config.generator) {
  _usage()
}

doParse(config, config.code, config.generator,
  (resultLine: string) => {
    config.tp(`Received result: (${resultLine.substring(0, 32)}... ...)`)
    config.parsedCode += `${resultLine}\n`
    // no difference, stdout gets lost
    // process.stdout.write(resultLine)
    // eslint-disable-next-line no-console
    console.log(resultLine) // ok
  },
  (parseError: string, hash: string) => {
    config.tp(`Parsing error ${parseError} ${hash}`)
    config.printError(`Parsing error found: ${parseError} ${hash}`)
    config.throwError(parseError)
  },
  (msg: string) => {
    if (!config.trace) {
      // dump to stderr, so output graph might still be usable
      config.printError('TRACE:' + msg)
    }
  }
)

config.tp(`finishing parsing ${config.input} and transpiling with ${config.generator}`)
config.tp(`got code len ${config.parsedCode.length}`)
