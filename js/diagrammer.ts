import { doWebVisualize } from './webvisualize.js'
import { doCliVisualize, supportsCliVisualization } from './clivisualize.js'
import { type VisualizeConfigType } from './visualizeConfigType.js'
import { type LexConfigType } from './lex.js'
import { type GenerateConfigType } from './generate.js'
import { runPestBinary } from './pest_adapter.js'

export function doParse(
  config: GenerateConfigType,
  diagrammerCode: string,
  visualizerName: string,
  resultCallback?: (resultLine: string) => void,
  parseErrorCallback?: (parseError: string, hash: string) => void,
  traceCallback?: (msg: string) => void) {
  if (!diagrammerCode.trim()) {
    config.throwError('No code to parser')
  }

  const result = resultCallback || ((line: string) => {
    config.parsedCode += `${line}\n`
    // eslint-disable-next-line no-console
    console.log(line)
  })

  const parseError = parseErrorCallback || ((str: string, hash: string) => {
    config.tp(`Parse error: ${str}`)
    config.throwError(str)
  })

  try {
    const output = runPestBinary(diagrammerCode, visualizerName)
    for (const line of output.trimEnd().split('\n')) {
      result(line)
    }
  } catch (ex: any) {
    parseError(String(ex), 'Caught Exception')
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
  config.tp('Lexing handled directly by Rust Pest parser')
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
    await doCliVisualize(useConfig, generatedGraphCode, visualizer, finished)
  } else {
    if (!useConfig.webPort) {
      useConfig.throwError('Webport missing, cannot render')
    }
    await doWebVisualize(useConfig, useConfig.code, visualizer, finished)
  }
}
