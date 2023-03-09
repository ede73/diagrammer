import * as lexer from '../build/diagrammer_lexer.js'
import { diagrammerParser } from '../build/diagrammer_parser.js'
import { GraphCanvas } from '../model/graphcanvas.js'

export function doParse (
  config,
  /** @type {string} */diagrammerCode,
  /** @type {string} */generator,
  /** @type {[(resultLine:string)=>void]} */resultCallback,
  /** @type {[(parseError:string, hash:string)=>void]} */parseErrorCallback,
  /** @type {[(msg:string)=>void]} */traceCallback) {
  if (!diagrammerCode.trim()) {
    config.tp.throwError('No code to parser')
  }
  diagrammerParser.yy.USE_GENERATOR = generator
  diagrammerParser.yy.trace = traceCallback || ((msg) => {})

  diagrammerParser.yy.result = resultCallback || ((result) => {
    // default callback unless overridden
    config.parsedCode += `${result}\n`
    // eslint-disable-next-line no-console
    console.log(result) // ok
  })

  // {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
  // parseError() in (generated) lexer, calls this.yy.parser.parseError() if available
  // TODO: MOVING TO GraphCanvas
  diagrammerParser.yy.parseError = parseErrorCallback || ((str, hash) => {
    config.tp(`Parse error: ${str}`)
    config.throwError(str)
  })
  diagrammerParser.yy.GRAPHCANVAS = new GraphCanvas()
  try {
    diagrammerParser.parse(diagrammerCode)
  } catch (ex) {
    // wow, something went down
    diagrammerParser.yy.parseError(String(ex), 'Caught Exception')
  }
}

export function doLex (
  config,
  /** @type {string} */diagrammerCode,
  /** @type {(token:string,codePart:any)=>void} */resultsCallback) {
  if (!diagrammerCode.trim()) {
    config.tp.throwError('No code to lexer')
  }
  config.tp('Begin lex testing')
  const st = lexer.diagrammerLexer
  st.setInput(diagrammerCode)
  let h
  while (h !== 'EOF' && h !== 1) {
    try {
      h = st.lex()
    } catch (ex) {
      config.tp(`${ex}`)
      throw ex
    }
    if (resultsCallback) {
      resultsCallback(h, st)
    }
  }
}
