// @ts-check
import { parse as diagrammerParse } from '../build/diagrammer_parser.js'
import { GraphCanvas } from '../model/graphcanvas.js'
import { getSelectedGenerator, getError, getInputElement, getSelectedVisualizer, setError, setGenerator } from './uiComponentAccess.js'
import { getParserYY } from '../build/types/diagrammer_parser_types.js'

let parsingStarted: number

function setupParser() {
  // TODO: MOVING TO GraphCanvas
  getParserYY().parseError = (str: string, hash: string) => {
    const pe = `Parsing error:\n${str}\n${hash}`
    throw new Error(pe)
  }

  getParserYY().parsedGeneratorAndVisualizer = (generator: string, visualizer: string, preferParsed: boolean) => {
    if (preferParsed && generator) {
      const useVisualizer = visualizer === 'undefined' ? undefined : visualizer
      setGenerator(generator, useVisualizer)
      console.warn(`  .. changed generator to ${generator} and visualizer ${useVisualizer ?? ''}`)
    }
  }

  /**
   *
   * @param {string} line
   */
  // called line by line...
  // TODO: MOVING TO GraphCanvas
  getParserYY().result = (line: string): void => {
    const result = getInputElement('diagrammer-result')

    if (parsingStarted === 1) {
      result.value = ''
    }
    parsingStarted++
    result.value = `${result.value + line.trimEnd()}\n`
  }

  /**
   * @param {string} traceMsg
   */
  // diagrammerParser.trace = function (traceMsg: string) {
  //   console.warn(`TRACE:${traceMsg}`)
  // }
}

/**
 * @param diagrammerCode Diagrammer graph to parse using
 * @param successCallback Passing final generator, visualizer
 * @param failureCallback passing error as string, exception as Exception
 */
export function parse(diagrammerCode: string, successCallback: (generator: string, visualizer: string) => void, failureCallback: (error: string, exception: DOMException) => void, preferScriptSpecifiedGeneratorAndVisualizer = false) {
  const generator = getSelectedGenerator()
  const visualizer = getSelectedVisualizer()

  setupParser()
  console.warn(`parse(${generator} ${visualizer} ${preferScriptSpecifiedGeneratorAndVisualizer ? 'preferScriptSpecifiedGeneratorAndVisualizer' : ''})`)
  if (!generator) {
    throw new Error('Generator not defined')
  }
  if (!visualizer) {
    throw new Error('Visualizer not defined')
  }
  // not atomic, but good enuf for UI
  if (parsingStarted >= 1) {
    console.error('We already have a parsing underway, bail out!')
  }
  parsingStarted = 1
  setError('')
  try {
    const yy = getParserYY()
    // TODO: MOVING TO GraphCanvas
    yy.USE_GENERATOR = generator
    // TODO: MOVING TO GraphCanvas
    yy.USE_VISUALIZER = visualizer
    // If true, actually prefer generator/visualizer from loaded script IF specified
    // used while loading new examples...
    yy.PREFER_GENERATOR_VISUALIZER_FROM_DIAGRAMMER = preferScriptSpecifiedGeneratorAndVisualizer
    yy.GRAPHCANVAS = new GraphCanvas()
    diagrammerParse(diagrammerCode)

    try {
      successCallback(getSelectedGenerator(), getSelectedVisualizer())
    } catch (ex) {
      setError(`Parsing went ok, but visualization failed: ${getError()} and ${String(ex)}`)
    }
  } catch (ex) {
    setError(`  ..parsed, and failed ${getError()} and ${String(ex)}`)
    failureCallback(getError(), ex)
  } finally {
    parsingStarted = 0
  }
}
