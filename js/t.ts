#!/usr/bin/env node
import * as fs from 'fs'
import path from 'path'
import { configSupport, type ConfigType } from '../js/configsupport.js'
import { doLex, doParse, doVisualize } from '../js/diagrammer.js'
import { type LexConfigType } from '../js/lex.js'
import { type VisualizeConfigType } from '../js/visualizeConfigType.js'
import { type GenerateConfigType } from './generate.js'
import { findGeneratorForVisualization, hasVisualizer, visualizations, visualizationsToGenerators } from './config.js'

interface TestRunnerConfig extends ConfigType {
  tests: boolean
  text: boolean
  format: string
  visualizer: string
  visualizedGraph: string
  parsedCode: string
  written: number
  webPort: number
  code: string

}

export function getEmptyConfig() {
  return configSupport<TestRunnerConfig>('t.js', {
    tests: false,
    text: false,
    format: 'png',
    visualizer: '',
    visualizedGraph: '-',
    parsedCode: '',
    written: 0,
    webPort: 8000
  })
}

// TODO: refactor away
function _isHackyWebVisualizer(config: TestRunnerConfig, overrideVisualizer?: string) {
  // TODO: test runner support pending
  if (config.tests) {
    return false
  }
  const searchVisualizer = overrideVisualizer || config.visualizer
  const s = visualizations.find(p => p.name === searchVisualizer)
  return s?.webVisualizer
}

function _exitError(useConfig, msg: string) {
  useConfig.printError(msg)
  process.exit(10)
}

export async function lexParseAndVisualize(useConfig: TestRunnerConfig, visualizationisComplete: (exitCode: number) => Promise<void>) {
  if (useConfig.isPipeMarker(useConfig.input) && !useConfig.beingPiped()) {
    _exitError(useConfig, 'Supposed to receive graph via pipe, but not being piped!')
  } else if (!useConfig.isPipeMarker(useConfig.input) && !fs.existsSync(useConfig.input)) {
    _exitError(useConfig, `Existing input file required, got "${useConfig.input}", check usage -h`)
  }

  useConfig.code = await useConfig.readFile(useConfig.input)
  if (useConfig.code.trim() === '') {
    useConfig.throwError('No code...')
  }

  useConfig.tp(`Config: ${JSON.stringify(useConfig)}`)
  // use lexer (separate lexer test process) only during test runs
  if (useConfig.tests) {
    useConfig.tp('Prepare lexical tester')
    doLex(useConfig as LexConfigType, useConfig.code, (token, codePart: string) => {
      if (useConfig.trace) { useConfig.tp(`LEX: ${token} ${codePart}`) }
    })
  }

  useConfig.tp('Start parsing process')

  let errors = 0
  doParse(
    useConfig as unknown as GenerateConfigType,
    useConfig.code,
    findGeneratorForVisualization(useConfig.visualizer),
    (result) => {
      useConfig.parsedCode += `${result}\n`
    }, (parseError, hash) => {
      useConfig.tp(`Parse error: ${parseError} ${hash}`)
      errors++
    }, (trace) => {
      if (useConfig.trace) {
        useConfig.tp(`parser trace: ${trace}`)
      }
    })

  if (errors) {
    await visualizationisComplete(666)
    return
  }

  await doVisualize(useConfig as unknown as VisualizeConfigType, useConfig.parsedCode, useConfig.visualizer, (exitCode) => {
    visualizationisComplete(exitCode).catch(r => { })
  })
}

async function _main(argv: any[]) {
  const config = getEmptyConfig()
  function _usage() {
    const visualizers = visualizations.map(p => p.name)
    const webVisualizers = visualizations.filter(p => p.webVisualizer).map(p => p.name)
    config.printError(`USAGE: [silent] [dont_run_visualizer] [tests] [verbose] [text] [svg] [output file] [INPUT] [${visualizers.join(', ')}]`)
    config.printError('Each visualizer will get converted to proper generator')
    config.printError(`Experimental: Web only renderers: [${webVisualizers.join(', ')}]`)
    process.exit(0)
  }

  let _collectOutput = false
  let _collectPort = false
  await config.parseCommandLine(argv.splice(1), _usage, async (unknownCommandLineOption) => {
    if (_collectPort) {
      _collectOutput = false
      config.webPort = Number(unknownCommandLineOption)
      return
    }
    if (_collectOutput) {
      _collectOutput = false
      config.visualizedGraph = unknownCommandLineOption.trim()
      return
    }
    switch (unknownCommandLineOption.toLocaleLowerCase().trim()) {
      case 'output':
        _collectOutput = true
        return
      case 'webport':
        _collectPort = true
        return
      case 'tests':
        config.tests = true
        return
      // TODO:
      case 'text':
        config.text = true
        return
      case 'svg':
        config.format = 'svg'
        return
    }
    // Allow using absolute and relative paths! (currently abs.paths dont work)
    // ALSO detect piping/redirection and make 'em work
    if (!config.input && fs.existsSync(unknownCommandLineOption)) {
      config.input = unknownCommandLineOption.trim()
      return
    }
    // must be visualizer?
    const visualizer = unknownCommandLineOption.toLocaleLowerCase()
    if (hasVisualizer(visualizer) || _isHackyWebVisualizer(config, visualizer)) {
      config.visualizer = visualizer
    }
    if (!_isHackyWebVisualizer(config) && (!config.visualizer || !hasVisualizer(config.visualizer))) {
      config.throwError(`Could not determine visualizer (${config.visualizer}) (nor its generator)`)
    }
  })

  if (!config.input && config.beingPiped()) {
    config.input = config.pipeMarker
  }
  config.tp('Begin lexParseAndVisualize')
  await lexParseAndVisualize(config, async (): Promise<void> => {
    config.tp('Visualization has been completed')
  })
}

if (`${process.argv[1]}`.endsWith('t.js')) {
  // this script sits in js, so going one path level up is expected
  process.chdir(path.join(path.dirname(process.argv[1]), '..'))
  await _main(process.argv.splice(1))
}
