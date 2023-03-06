#!/usr/bin/env node
// Usage: (typically called from t.sh or CLI in general, web uses diagrammer_parser.js directly via index.js)
// Usage: node js/diagrammer.js [verbose] inputFile [lex] digraph|nwdiag|actdiag|blockdiag|plantuml_sequence >output
// Usage: node js/diagrammer.js verbose tests/test_inputs/state_group.txt ast

import * as fs from 'fs'
import * as lexer from '../build/diagrammer_lexer.js'
import { diagrammerParser } from '../build/diagrammer_parser.js'
import { generators, GraphCanvas } from '../model/graphcanvas.js'
import { setVerbose } from '../model/debug.js'
import { configSupport } from '../js/configsupport.js'

function startedAsCommandline () {
  // terrible
  return `${process.argv[1]}`.endsWith('diagrammer.js')
}

export function doParse (
  config,
  /** @type {string} */diagrammerCode,
  /** @type {string} */generator,
  /** @type {[(resultLine:string)=>void]} */resultCallback,
  /** @type {[(parseError:string, hash:string)=>void]} */parseErrorCallback,
  /** @type {[(msg:string)=>void]} */traceCallback) {
  diagrammerParser.yy.USE_GENERATOR = generator
  diagrammerParser.yy.trace = traceCallback || ((msg) => {})

  diagrammerParser.yy.result = resultCallback || ((result) => {
    // default callback unless overridden
    config.parsedCode += `${result}\n`
    console.log(result)
  })

  // {text: this.lexer.match, token: this.terminals_[symbol] || symbol, line: this.lexer.yylineno, loc: yyloc, expected: expected});
  // parseError() in (generated) lexer, calls this.yy.parser.parseError() if available
  // TODO: MOVING TO GraphCanvas
  diagrammerParser.yy.parseError = parseErrorCallback || ((str, hash) => {
    config.tp(`Parse error: ${str}`)
    config.throwError(str)
  })
  diagrammerParser.yy.GRAPHCANVAS = new GraphCanvas()
  diagrammerParser.parse(diagrammerCode)
}

export function doLex (
  config,
  /** @type {string} */diagrammerCode,
  /** @type {(token:string,codePart:any)=>void} */resultsCallback) {
  config.tp('Begin lex testing')
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
  const config = configSupport('diagrammer.js', {
    lex: false,
    gemerator: '',
    code: '',
    parsedCode: ''
  })

  function _usage () {
    config.printError('USAGE: [trace] [verbose] [lex] [INPUT] [GENERATOR]')
    process.exit(0)
  }

  await config.parseCommandLine(argv.splice(1), _usage, async (unknownCommandLineOption) => {
    switch (unknownCommandLineOption.toLocaleLowerCase()) {
      case 'lex':
        config.lex = true
    }
    if (!config.input && fs.existsSync(unknownCommandLineOption)) {
      if (config.code) {
        config.throwError('Something is wrong, going to read the code twice')
      }
      config.tp(`Read diagrammer code from ${unknownCommandLineOption}`)
      config.input = unknownCommandLineOption.trim()
      config.code = await config.readFile(config.input)
      return
    }
    // must be generator
    const generator = unknownCommandLineOption.toLocaleLowerCase()
    if (!generators.has(generator)) {
      config.throwError(`Unknown generator (${generator})`)
    }
    config.generator = generator
  })

  if (config.verbose) {
    setVerbose(true)
  }
  if (config.trace) {
    config.printError("# If you didn't compile with DEBUG=1 make, deep tracing the grammar won't work")
  }
  if (config.beingPiped() && config.isPipeMarker(config.input)) {
    // we're probably being piped!
    config.tp('Reading from pipe')
    config.input = config.pipeMarker
    config.code = await config.readFile(config.pipeMarker)
  }
  if (!config.input) {
    _usage()
  }

  if (!config.code) {
    config.throwError('Failed reading code to parse')
  }
  if (config.lex) {
    // export function doLex (/** @type {string} */diagrammerCode, /** @type {(token:string,codeSnippet:any)=>void} */resultsCallback) {
    doLex(config, config.code, (token, codeSnippet) => {
      if (config.trace || config.verbose) {
        // pass to stderr, so we can still use the stdout for actual graph (well depending)
        config.printError('State:' + token + '(' + codeSnippet.yytext + ')')
      }
    })
  } else {
    if (!config.generator) {
      _usage()
    }
    doParse(config, config.code, config.generator,
      (resultLine) => {
        config.tp(`Received result: (${resultLine.substring(0, 32)}... ...)`)
        config.parsedCode += `${resultLine}\n`
        // no difference, stdout gets lost
        // process.stdout.write(resultLine)
        console.log(resultLine)
      },
      (parseError, hash) => {
        config.tp(`Parsing error ${parseError} ${hash}`)
        config.printError(`Parsing error found: ${parseError} ${hash}`)
        config.throwError(parseError)
      },
      (msg) => {
        if (!config.trace) {
          // dump to stderr, so output graph might still be usable
          config.printError('TRACE:' + msg)
        }
      }
    )
  }
  if (config.lex) {
    config.tp(`finishing up lexing ${config.input}`)
  } else {
    config.tp(`finishing parsing ${config.input} and transpiling with ${config.generator}`)
    config.tp(`got code len ${config.parsedCode.length}`)
  }
}

// terrible
if (startedAsCommandline()) {
  // process.stdout.allowHalfOpen = true
  // process.stdin.allowHalfOpen = true
  await _main(process.argv.splice(1))
  // Something is seriously broken in node.js stdio! (Probably since they made it fully async)
  // It often looses the written data, callbacks never called. Devs ignore all the whine
  // cat whatever | tee whatever has worked for decades (make two node processes, pipe together, spawn..failure :) )
  // TODO: Stop using lexer/parser as processes, make'em function calls
  // Visualizer still needs to be a process.. This timeout MAKES SURE stdout gets flushes and read on t.js (sad..really sad)
  await new Promise(resolve => setTimeout(resolve, 2000))
  process.stdout.write('', process.exit)
  // process.stdout.end()
  // process.stderr.end()
}
