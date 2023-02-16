// Usage: (typically called from t.sh or CLI in general, web uses diagrammer_parser.js directly via index.js)
// Usage: node js/diagrammer.js [verbose] inputFile [lex] digraph|nwdiag|actdiag|blockdiag|plantuml_sequence >output
// Usage: node js/diagrammer.js verbose tests/test_inputs/state_group.txt ast

// CommonJS crap
// const fs = require('fs');
// const path = require('path');

// ES
import * as fs from 'fs'
import * as path from 'path'
import * as lexer from '../build/diagrammer_lexer.js'
import { diagrammerParser } from '../build/diagrammer_parser.js'

let myArgs = process.argv.slice(2)

let VERBOSE = false
if (myArgs[0] === 'verbose') {
  VERBOSE = true
  myArgs = myArgs.slice(1)
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
  // const diagrammerParser = require("../build/diagrammer_parser.js");
  let errors = 0
  // TODO: MOVING TO GraphCanvas
  diagrammerParser.yy.USE_GENERATOR = myArgs[1]
  // TODO: MOVING TO GraphCanvas
  diagrammerParser.trace = function (x) {
    console.log('TRACE:' + x)
  }
  // TODO: MOVING TO GraphCanvas
  diagrammerParser.debug = function (x) {
    console.log('DEBUG:' + x)
  }
  // TODO: MOVING TO GraphCanvas
  diagrammerParser.yy.result = function (result) {
    console.log(result)
  }

  // {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
  // TODO: MOVING TO GraphCanvas
  diagrammerParser.yy.parseError = function (str, hash) {
    console.log('Parsing error found:')
    console.log(str)
    console.log(hash)
    errors = 1
    throw new Error(str)
  }
  diagrammerParser.parse(raw)
  if (errors === 1) {
    console.log('Errors....')
    process.exit(9)
  }
  process.exit(0)
}
