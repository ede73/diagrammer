#!/usr/bin/env node
// Usage: (typically called from t.sh or CLI in general, web uses diagrammer_parser.js directly via index.js)
// Usage: node js/diagrammer.js [verbose] inputFile [lex] digraph|nwdiag|actdiag|blockdiag|plantuml_sequence >output
// Usage: node js/diagrammer.js verbose tests/test_inputs/state_group.txt ast

import * as fs from 'fs'
import * as tty from 'node:tty'
import * as lexer from '../build/diagrammer_lexer.js'
import { diagrammerParser } from '../build/diagrammer_parser.js'
import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { setVerbose } from '../model/debug.js'

function startedAsCommandline () {
  // terrible
  return `${process.argv[1]}`.endsWith('diagrammer.js')
}

let traceProcess = (msg) => { }
export function doParse (
  /** @type {string} */diagrammerCode,
  /** @type {string} */generator,
  /** @type {[(resultLine:string)=>void]} */resultCallback,
  /** @type {[(parseError:string, hash:string)=>void]} */parseErrorCallback,
  /** @type {[(msg:string)=>void]} */traceCallback) {
  diagrammerParser.yy.USE_GENERATOR = generator
  diagrammerParser.yy.trace = traceCallback || ((msg) => {})

  diagrammerParser.yy.result = resultCallback || ((result) => {
    console.log(result)
  })

  // {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
  // parseError() in (generated) lexer, calls this.yy.parser.parseError() if available
  // TODO: MOVING TO GraphCanvas
  diagrammerParser.yy.parseError = parseErrorCallback || ((str, hash) => {
    throw new Error(str)
  })
  diagrammerParser.yy.GRAPHCANVAS = new GraphCanvas()
  diagrammerParser.parse(diagrammerCode)
}

export function doLex (
  /** @type {string} */diagrammerCode,
  /** @type {(token:string,codePart:any)=>void} */resultsCallback) {
  traceProcess('Begin lex testing')
  const st = lexer.diagrammerLexer
  st.setInput(diagrammerCode)
  let h
  while (h !== 'EOF' && h !== 1) {
    h = st.lex()
    if (resultsCallback) {
      resultsCallback(h, st)
    }
  }
}

async function _main (argv) {
  const config = {
    verbose: false,
    trace: false,
    traceProcess: false,
    lex: false,
    input: '',
    gemerator: '',
    code: ''
  }

  traceProcess = (msg) => {
    if (config.traceProcess) {
      console.error(`trace:${msg}`)
    }
  }
  function _usage () {
    console.log('USAGE: [trace] [verbose] [lex] [INPUT] [GENERATOR]')
    process.exit(0)
  }

  function beingPiped () {
    return !(process.stdin instanceof tty.ReadStream)
  }

  for (const m of argv.splice(1)) {
    switch (m.toLocaleLowerCase().trim()) {
      case '-h':
      case '--help':
      case 'help':
        _usage()
        continue
      case 'lex':
        config.lex = true
        config.trace = true
        config.verbose = true
        continue
      case 'verbose':
        setVerbose(true)
        config.verbose = true
        continue
      case 'trace':
        console.log("# If you didn't compile with DEBUG=1 make, deep tracing the grammar won't work")
        config.trace = true
        continue
      case 'traceprocess':
        config.traceProcess = true
        continue
    }

    if (m === '-') {
      // we're told we're being piped
      if (!beingPiped()) {
        throw new Error('Expecting piped input')
      }
      config.input = '-'
      continue
    }

    if (!config.input && fs.existsSync(m.trim())) {
      traceProcess('Read diagrammer code')
      config.input = m.trim()
      config.code = fs.readFileSync(config.input, 'utf8')
      continue
    }
    // must be generator
    const generator = m.toLocaleLowerCase().trim()
    if (!generators.has(generator)) {
      throw new Error(`Unknown generator (${generator})`)
    }
    config.generator = generator
  }

  if (beingPiped() && config.input === '-') {
    // we're probably being piped!
    config.input = '-'
    config.code = await (() => {
      return new Promise(function (resolve, reject) {
        const stdin = process.stdin
        let data = ''
        stdin.setEncoding('utf8')
        stdin.on('data', function (chunk) { data += chunk })
        stdin.on('end', function () { resolve(data) })
        stdin.on('error', reject)
      })
    })().catch(console.error)
  }
  if (!config.input) {
    _usage()
  }

  if (config.lex) {
    // export function doLex (/** @type {string} */diagrammerCode, /** @type {(token:string,codeSnippet:any)=>void} */resultsCallback) {
    doLex(config.code, (token, codeSnippet) => {
      if (config.trace || config.verbose) {
        // pass to stderr, so we can still use the stdout for actual graph (well depending)
        console.error('State:' + token + '(' + codeSnippet.yytext + ')')
      }
    })
  } else {
    if (!config.generator) {
      _usage()
    }
    doParse(config.code, config.generator,
      (resultLine) => {
        console.log(resultLine)
      },
      (parseError, hash) => {
        console.log('Parsing error found:')
        console.log(parseError)
        console.log(hash)
        throw new Error(parseError)
      },
      (msg) => {
        if (!config.trace) {
          // dump to stderr, so output graph might still be usable
          console.error('TRACE:' + msg)
        }
      }
    )
    traceProcess('Parsing has been completed with no errrors')
  }
}

// terrible
if (startedAsCommandline()) {
  await _main(process.argv.splice(1))
}
