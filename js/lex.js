#!/usr/bin/env node

import * as fs from 'fs'
import { configSupport } from '../js/configsupport.js'
import { doLex } from '../js/diagrammer.js'

// TODO: Convert to TypeScript

const config = configSupport('lex.js', {
  lex: true,
  code: ''
})

function _usage () {
  config.printError('USAGE: [trace] [verbose] [INPUT]')
  process.exit(0)
}

// 2 or 1?
await config.parseCommandLine(process.argv.splice(2), _usage, async (unknownCommandLineOption) => {
  switch (unknownCommandLineOption.toLocaleLowerCase()) {
    case 'lex':
      config.lex = true
      return
  }
  if (!config.input && fs.existsSync(unknownCommandLineOption)) {
    if (config.code) {
      config.throwError('Something is wrong, going to read the code twice')
    }
    config.tp(`Read diagrammer code from ${unknownCommandLineOption}`)
    config.input = unknownCommandLineOption.trim()
    config.code = await config.readFile(config.input)
  }
})

if (config.trace) {
  config.printError("# If you didn't compile with DEBUG=1 make, deep tracing the grammar won't work")
}

if (config.beingPiped()) {
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

doLex(config, config.code, (token, codeSnippet) => {
  // pass to stderr, so we can still use the stdout for actual graph (well depending)
  config.printError('State:' + token + '(' + codeSnippet.yytext + ')')
})
