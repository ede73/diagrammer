// @ts-check
import { diagrammerParser } from '../build/diagrammer_parser.js'
import { GraphCanvas } from '../model/graphcanvas.js'
import { getGenerator, getError, getInputElement, getVisualizer, setError, setGenerator } from './uiComponentAccess.js'

/**
 * @type {number}
 */
let parsingStarted

/**
 *
 * @param {string} str
 * @param {string} hash
 */
// TODO: MOVING TO GraphCanvas
diagrammerParser.yy.parseError = function (str, hash) {
  const pe = `Parsing error:\n${str}\n${hash}`
  console.log('pe')
  setError(pe)
  throw new Error(str)
}

diagrammerParser.yy.parsedGeneratorAndVisualizer = (generator, visualizer, preferParsed) => {
  console.log(`  ..script suggests using generator ${generator} and visualizer ${visualizer} and prefer ${preferParsed}`)
  if (preferParsed && generator) {
    const useVisualizer = visualizer === 'undefined' ? undefined : visualizer
    setGenerator(generator, useVisualizer)
    console.log(`  .. changed generator to ${generator} and visualizer ${useVisualizer}`)
  }
}

/**
 *
 * @param {string} line
 */
// called line by line...
// TODO: MOVING TO GraphCanvas
diagrammerParser.yy.result = function (line) {
  /** @type {HTMLInputElement} */
  const result = getInputElement('diagrammer-result')

  if (parsingStarted === 1) {
    console.log('  ...parsing results start coming in...')
    result.value = ''
  }
  parsingStarted++
  result.value = `${result.value + line.trimEnd()}\n`
}

/**
 * @param {string} x
 */
// TODO: MOVING TO GraphCanvas
// @ts-ignore
diagrammerParser.trace = function (x) {
  console.log(`TRACE:${x}`)
}

/**
 * @param {string} diagrammerCode Diagrammer graph to parse using
 * @param {function(string, string):void} successCallback Passing final generator, visualizer
 * @param {function(string, DOMException):void} failureCallback passing error as string, exception as Exception
 */
export function parse (diagrammerCode, successCallback, failureCallback, preferScriptSpecifiedGeneratorAndVisualizer = false) {
  const generator = getGenerator()
  const visualizer = getVisualizer()

  console.log(`parse(${generator} ${visualizer} ${preferScriptSpecifiedGeneratorAndVisualizer})`)
  if (!generator) {
    throw new Error('Generator not defined')
  }
  if (!visualizer) {
    throw new Error('Visualizer not defined')
  }
  // not atomic, but good enuf for UI
  if (parsingStarted >= 1) {
    console.log('We already have a parsing underway, bail out!')
  }
  parsingStarted = 1
  setError('')
  try {
    delete (diagrammerParser.yy.GRAPHCANVAS)
    // TODO: MOVING TO GraphCanvas
    diagrammerParser.yy.USE_GENERATOR = generator
    // TODO: MOVING TO GraphCanvas
    diagrammerParser.yy.USE_VISUALIZER = visualizer
    // If true, actually prefer generator/visualizer from loaded script IF specified
    // used while loading new examples...
    diagrammerParser.yy.PREFER_GENERATOR_VISUALIZER_FROM_DIAGRAMMER = preferScriptSpecifiedGeneratorAndVisualizer
    diagrammerParser.yy.GRAPHCANVAS = new GraphCanvas()
    // @ts-ignore
    diagrammerParser.parse(diagrammerCode)
    console.log(`  ..parsed, calling it a success with ${getGenerator()} and ${getVisualizer()}`)

    try {
      successCallback(getGenerator(), getVisualizer())
    } catch (ex) {
      setError(`Parsing went ok, but visualization failed: ${getError()} and ${ex}`)
    }
  } catch (ex) {
    setError(`  ..parsed, and failed ${getError()} and ${ex}`)
    failureCallback(getError(), ex)
  } finally {
    parsingStarted = 0
  }
}
