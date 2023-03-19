import * as lexer from '../build/diagrammer_lexer.js'
import { GraphCanvas } from '../model/graphcanvas.js'
import { parse as diagrammerParse } from '../build/diagrammer_parser.js'
import { doWebVisualize } from './webvisualize.js'
import { doCliVisualize, supportsCliVisualization } from './clivisualize.js'
import { type VisualizeConfigType } from './visualizeConfigType.js'
import { type LexConfigType } from './lex.js'
import { type GenerateConfigType } from './generate.js'
import { getParserYY } from '../build/types/diagrammer_parser_types.js'

export function doParse(
  config: GenerateConfigType,
  diagrammerCode: string,
  generatorName: string,
  resultCallback?: (resultLine: string) => void,
  parseErrorCallback?: (parseError: string, hash: string) => void,
  traceCallback?: (msg: string) => void) {
  if (!diagrammerCode.trim()) {
    config.throwError('No code to parser')
  }
  const parserYY = getParserYY()
  parserYY.USE_GENERATOR = generatorName
  parserYY.trace = traceCallback || ((msg: string) => { })

  // default callback unless overridden
  parserYY.result = resultCallback || ((result: string) => {
    config.parsedCode += `${result}\n`
    // eslint-disable-next-line no-console
    console.log(result) // ok
  })

  // TODO: MOVING TO GraphCanvas
  parserYY.parseError = parseErrorCallback || ((str: string, hash: string) => {
    config.tp(`Parse error: ${str}`)
    config.throwError(str)
  })
  parserYY.GRAPHCANVAS = new GraphCanvas()
  try {
    diagrammerParse(diagrammerCode)
  } catch (ex) {
    // wow, something went down
    parserYY.parseError(String(ex), 'Caught Exception')
    throw ex
  }
}

export function doLex(
  config: LexConfigType,
  diagrammerCode: string,
  resultsCallback: (token: string, codePart: any) => void) {
  if (!diagrammerCode.trim()) {
    config.throwError('No code to lexer')
  }
  config.tp('Begin lex testing')
  const st = lexer.diagrammerLexer
  st.setInput(diagrammerCode)
  let h
  while (h !== 'EOF' && h !== 1) {
    try {
      h = st.lex()
    } catch (ex) {
      // ex could be anything really
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      config.tp(`${ex}`)
      throw ex
    }
    if (resultsCallback) {
      resultsCallback(h, st)
    }
  }
}

export async function doVisualize(
  useConfig: VisualizeConfigType,
  generatedGraphCode: string,
  visualizer: string,
  finished: (exitcode: number) => void) {
  if (generatedGraphCode === '') {
    useConfig.throwError('no parsed code')
  }
  if (supportsCliVisualization(useConfig)) {
    // TODO: oddity for momentarily, expecting diagrammer, not parser language..will change
    await doCliVisualize(useConfig, generatedGraphCode, visualizer, finished)
  } else {
    if (!useConfig.webPort) {
      useConfig.throwError('Webport missing, cannot render')
    }
    await doWebVisualize(useConfig, useConfig.code, visualizer, finished)
  }
}
