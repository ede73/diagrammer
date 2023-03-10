#!/usr/bin/env node

import { configSupport } from '../js/configsupport.js'
import { doVisualize } from '../js/diagrammer.js'

const config = configSupport('visualize.js', {
  visualizer: '',
  code: '',
  visualizedGraph: '-',
  web: false,
  format: 'png'
})

function _usage () {
  config.printError('USAGE: [verbose] [INPUT] visualizer')
  process.exit(0)
}

let _collectOutput = false
await config.parseCommandLine(process.argv.splice(2), _usage, async (unknownCommandLineOption) => {
  if (_collectOutput) {
    _collectOutput = false
    config.tp(`Asked to collect output: got (${unknownCommandLineOption})`)
    config.visualizedGraph = unknownCommandLineOption.trim()
    return
  }
  switch (unknownCommandLineOption.toLocaleLowerCase()) {
    case 'output':
      _collectOutput = true
      return
    case 'web':
      config.useWebVisualizer = true
      return
    case 'svg':
      config.format = 'svg'
      return
  }
  config.tp(`Must be visualizer directive (${unknownCommandLineOption})`)
  config.visualizer = unknownCommandLineOption
})

if (config.beingPiped()) {
  // we're probably being piped!
  config.tp('Reading from pipe')
  config.input = config.pipeMarker
}
config.code = await config.readFile(config.pipeMarker)
if (!config.input) {
  _usage()
}

if (!config.code) {
  config.throwError('Failed reading code to parse')
}

doVisualize(config, config.code, config.visualizer, (exitCode) => {
  console.error('done')
})
