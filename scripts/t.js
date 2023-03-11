#!/usr/bin/env node
import * as fs from 'fs'
import path from 'path'
// required to populate generators/visualizations
// eslint-disable-next-line no-unused-vars
import { diagrammerParser } from '../build/diagrammer_parser.js'
import { generators, visualizations } from '../model/graphcanvas.js'
import { configSupport } from '../js/configsupport.js'
import { doLex, doParse, doVisualize } from '../js/diagrammer.js'
import { _getWebVisualizers } from '../js/webvisualize.js'

// TODO: Convert to TypeScript

function visualizersToGenerators () {
  const visualiserToGenerator = new Map()
  visualizations.forEach((visualizers, generator) => {
    visualizers.forEach((visualizer, index) => {
      visualiserToGenerator.set(visualizer, generator)
      visualiserToGenerator.set(`${generator}:${visualizer}`, generator)
    })
  })

  const g = Array.from(generators.keys()).map(k => [k, k])
  return new Map([...visualiserToGenerator, ...g])
}

export function getEmptyConfig () {
  return configSupport('t.js', {
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
function _isHackyWebVisualizer (config, overrideVisualizer) {
  // TODO: test runner support pending
  if (config.tests) {
    return false
  }
  const searchVisualizer = overrideVisualizer || config.visualizer
  return _getWebVisualizers().includes(searchVisualizer)
}

function _exitError (useConfig, msg) {
  useConfig.printError(msg)
  process.exit(10)
}

function _resolveGenerator (useConfig) {
  const generator = visualizersToGenerators().get(useConfig.visualizer)
  if (!generator) {
    throw Error(`Cannot map visualizer (${useConfig.visualizer}) to a generator`)
  }
  return generator
}

export async function lexParseAndVisualize (useConfig, visualizationisComplete) {
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
    doLex(useConfig, useConfig.code, (token, codePart) => {
      if (useConfig.trace) { useConfig.tp(`LEX: ${token} ${codePart}`) }
    })
  }

  useConfig.tp('Start parsing process')

  // TODO: temp, remove when web viz..finished
  if (_isHackyWebVisualizer(useConfig.visualizer)) {
    throw new Error('TODO: No support running web visualizers yet')
  }

  let errors = 0
  doParse(
    useConfig,
    useConfig.code,
    _resolveGenerator(useConfig),
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
    visualizationisComplete(666)
    return
  }

  await doVisualize(useConfig, useConfig.parsedCode, useConfig.visualizer, (exitCode) => {
    visualizationisComplete(exitCode)
  })
}

async function _main (argv) {
  const config = getEmptyConfig()
  function _usage () {
    const visualizers = Array.from(visualizersToGenerators().keys())
    config.printError(`USAGE: [silent] [dont_run_visualizer] [tests] [verbose] [text] [svg] [output file] [INPUT] [${visualizers.join(', ')}]`)
    config.printError('Each visualizer will get converted to proper generator')
    config.printError(`Experimental: Web only renderers: [${_getWebVisualizers().join(', ')}]`)
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
      // TODO:
      case 'skipparsermake':
        config.skipparsermake = true
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
    const v = visualizersToGenerators()
    if (v.has(visualizer) || _isHackyWebVisualizer(config, visualizer)) {
      config.visualizer = visualizer
    }
    if (!_isHackyWebVisualizer(config) && (!config.visualizer || !_resolveGenerator(config))) {
      config.throwError(`Could not determine visualizer (${visualizer}) (nor its generator)`)
    }
  })

  if (!config.input && config.beingPiped()) {
    config.input = config.pipeMarker
  }
  config.tp('Begin lexParseAndVisualize')
  await lexParseAndVisualize(config, () => {
    config.tp('Visualization has been completed')
  })
}

if (`${process.argv[1]}`.endsWith('t.js')) {
  // this script sits in js, so going one path level up is expected
  process.chdir(path.join(path.dirname(process.argv[1]), '..'))
  await _main(process.argv.splice(1))
}
