// @ts-check
import { parse as diagrammerParse } from '../build/diagrammer_parser.js'
import { GraphCanvas } from '../model/graphcanvas.js'
import { getError, getInputElement, getSelectedVisualizer, setError, setVisualizer } from './uiComponentAccess.js'
import { getParserYY } from '../build/types/diagrammer_parser_types.js'

let parsingStarted: number

function setupParser() {
  // TODO: MOVING TO GraphCanvas
  getParserYY().parseError = (str: string, hash: string) => {
    const pe = `Parsing error:\n${str}\n${hash}`
    throw new Error(pe)
  }

  getParserYY().parsedVisualizer = (visualizer: string, preferParsed: boolean) => {
    if (preferParsed && visualizer) {
      setVisualizer(visualizer)
      console.warn(`  .. changed visualizer ${visualizer ?? ''}`)
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
export function parse(diagrammerCode: string, successCallback: (visualizer: string) => void, failureCallback: (error: string, exception: DOMException) => void, preferScriptSpecifiedVisualizer = false) {
  const visualizer = getSelectedVisualizer()

  setupParser()
  console.warn(`parse(${visualizer} ${preferScriptSpecifiedVisualizer ? 'preferScriptSpecifiedVisualizer' : ''})`)
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
    yy.USE_VISUALIZER = visualizer
    // If true, actually prefer generator/visualizer from loaded script IF specified
    // used while loading new examples...
    yy.PREFER_VISUALIZER_FROM_DIAGRAMMER = preferScriptSpecifiedVisualizer
    yy.GRAPHCANVAS = new GraphCanvas()
    diagrammerParse(diagrammerCode)

    try {
      successCallback(getSelectedVisualizer())
    } catch (ex) {
      setError(`Parsing went ok, but visualization failed: ${getError()} and ${String(ex)}`)
    }
  } catch (ex) {
    setError(`  ..parsed, and failed ${getError()} and ${String(ex)}`, ex)
    failureCallback(getError(), ex)
  } finally {
    parsingStarted = 0
  }
}
