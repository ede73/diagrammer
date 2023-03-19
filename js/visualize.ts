#!/usr/bin/env node

import { configSupport } from './configsupport.js'
import { doVisualize } from './diagrammer.js'
import * as fs from 'fs'
import { type VisualizeConfigType } from './visualizeConfigType.js'
import { visualizations } from './config.js'

const config = configSupport<VisualizeConfigType>('visualize.js', {
  visualizer: '',
  code: '',
  visualizedGraph: '-',
  format: 'png',
  webPort: 8000
})

function _usage() {
  const visualizers = visualizations.filter(p => p.webVisualizer).map(p => p.name)
  config.printError(`USAGE: [verbose] [INPUT] ${visualizers.join('|')}]`)
  process.exit(0)
}

let _collectOutput = false
let _collectPort = false
await config.parseCommandLine(process.argv.splice(2), _usage, async (unknownCommandLineOption) => {
  if (_collectPort) {
    config.webPort = Number(unknownCommandLineOption)
    _collectPort = false
    return
  }
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
    case 'svg':
      config.format = 'svg'
      return
    case 'webport':
      _collectPort = true
      return
  }
  if (!config.input && fs.existsSync(unknownCommandLineOption)) {
    if (config.code) {
      config.throwError('Something is wrong, going to read the code twice')
    }
    config.tp(`Read diagrammer code from ${unknownCommandLineOption}`)
    config.input = unknownCommandLineOption.trim()
    config.code = await config.readFile(config.input)
    return
  }
  config.tp(`Must be visualizer directive (${unknownCommandLineOption})`)
  config.visualizer = unknownCommandLineOption
})

if (config.beingPiped()) {
  // we're probably being piped!
  config.tp('Reading from pipe')
  config.input = config.pipeMarker
  config.code = await config.readFile(config.input)
}
if (!config.input) {
  _usage()
}

if (!config.code) {
  config.throwError('Failed reading code to parse')
}

await doVisualize(config, config.code, config.visualizer, (exitCode) => {
  console.error('done')
})
