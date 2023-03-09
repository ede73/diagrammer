// @ts-check
import { diagrammerParser } from '../build/diagrammer_parser.js'
import { GraphCanvas } from '../model/graphcanvas.js'
import { getGenerator, getError, getInputElement, getVisualizer, setError, setGenerator } from './uiComponentAccess.js'

let parsingStarted: number

function setupParser() {
  // TODO: MOVING TO GraphCanvas
  diagrammerParser.yy.parseError = (str: string, hash: string) => {
    const pe = `Parsing error:\n${str}\n${hash}`
    throw new Error(str)
  }

  diagrammerParser.yy.parsedGeneratorAndVisualizer = (generator: string, visualizer: string, preferParsed: boolean) => {
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
  diagrammerParser.yy.result = (line: string): void => {
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
  // @ts-expect-error trace will exist after this
  diagrammerParser.trace = function (traceMsg: string) {
    console.warn(`TRACE:${traceMsg}`)
  }
}

/**
 * @param diagrammerCode Diagrammer graph to parse using
 * @param successCallback Passing final generator, visualizer
 * @param failureCallback passing error as string, exception as Exception
 */
export function parse(diagrammerCode: string, successCallback: (generator: string, visualizer: string) => void, failureCallback: (error: string, exception: DOMException) => void, preferScriptSpecifiedGeneratorAndVisualizer = false) {
  const generator = getGenerator()
  const visualizer = getVisualizer()

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
    delete (diagrammerParser.yy.GRAPHCANVAS)
    // TODO: MOVING TO GraphCanvas
    diagrammerParser.yy.USE_GENERATOR = generator
    // TODO: MOVING TO GraphCanvas
    diagrammerParser.yy.USE_VISUALIZER = visualizer
    // If true, actually prefer generator/visualizer from loaded script IF specified
    // used while loading new examples...
    diagrammerParser.yy.PREFER_GENERATOR_VISUALIZER_FROM_DIAGRAMMER = preferScriptSpecifiedGeneratorAndVisualizer
    diagrammerParser.yy.GRAPHCANVAS = new GraphCanvas()
    // @ts-expect-error TODO: type mismatch node vs vscode vs browser
    diagrammerParser.parse(diagrammerCode)

    try {
      successCallback(getGenerator(), getVisualizer())
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
