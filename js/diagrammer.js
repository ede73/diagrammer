// Usage: (typically called from t.sh or CLI in general, web uses diagrammer_parser.js directly via index.js)
// Usage: node js/diagrammer.js [verbose] inputFile [lex] digraph|nwdiag|actdiag|blockdiag|plantuml_sequence >output
// Usage: node js/diagrammer.js verbose tests/test_inputs/state_group.txt ast

import * as fs from 'fs'
import * as path from 'path'
import * as lexer from '../build/diagrammer_lexer.js'
import { diagrammerParser } from '../build/diagrammer_parser.js'
import { GraphCanvas } from '../model/graphcanvas.js'
import { setVerbose } from '../model/debug.js'

let myArgs = process.argv.slice(2)

let verbose = false
if (myArgs[0] === 'verbose') {
  setVerbose(true)
  myArgs = myArgs.slice(1)
  verbose = true
}

let trace = false
if (myArgs[0] === 'trace') {
  myArgs = myArgs.slice(1)
  trace = true
  console.log("# If you didn't compile with DEBUG=1 make, tracing grammar won't work")
}

const raw = fs.readFileSync(path.normalize('./' + myArgs[0]), 'utf8')

if (myArgs[1] === 'lex') {
  // const lexer = require("../build/diagrammer_lexer.js");
  // LEX
  const st = lexer.diagrammerLexer
  st.setInput(raw)
  let h
  while (h !== 'EOF' && h !== 1) {
    h = st.lex()
    console.log('State:' + h + '(' + st.yytext + ')')
  }
} else {
  let errors = 0

  diagrammerParser.yy.USE_GENERATOR = myArgs[1]
  diagrammerParser.yy.trace = (msg) => {
    if (trace) {
      console.log('TRACE:' + msg)
    }
  }

  diagrammerParser.yy.result = (result) => {
    console.log(result)
  }
  // {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
  // parseError() in (generated) lexer, calls this.yy.parser.parseError() if available
  // TODO: MOVING TO GraphCanvas
  diagrammerParser.yy.parseError = (str, hash) => {
    console.log('Parsing error found:')
    console.log(str)
    console.log(hash)
    errors++
    throw new Error(str)
  }
  diagrammerParser.yy.GRAPHCANVAS = new GraphCanvas()
  diagrammerParser.parse(raw)
  if (errors > 0) {
    console.log(`Errors.... ${errors}`)
    process.exit(9)
  }
  process.exit(0)
}
